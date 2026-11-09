"""Install a lightweight JDK + Android SDK (no Android Studio) and build a signed .aab."""
import os, sys, zipfile, subprocess, secrets, shutil, urllib.request, io, time

ROOT = r"C:\Users\Lenovo\Desktop\ghost-escape"
ANDROID = os.path.join(ROOT, "android")
SDK = os.path.join(os.environ.get("LOCALAPPDATA", r"C:\Users\Lenovo\AppData\Local"), "Android", "Sdk")
TOOLS_ZIP = "https://dl.google.com/android/repository/commandlinetools-win-14742923_latest.zip"
DIST = os.path.join(ROOT, "dist")

def run(cmd, env=None, cwd=None):
    print("+", cmd if isinstance(cmd, str) else " ".join(cmd), flush=True)
    r = subprocess.run(cmd, env=env, cwd=cwd, shell=isinstance(cmd, str))
    if r.returncode != 0:
        raise SystemExit(f"failed ({r.returncode}): {cmd}")

def find_java():
    for p in [
        shutil.which("java"),
        r"C:\Program Files\Microsoft\jdk-17.0.16.8-hotspot\bin\java.exe",
        r"C:\Program Files\Microsoft\jdk-17\bin\java.exe",
        r"C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot\bin\java.exe",
        r"C:\Program Files\Java\jdk-17\bin\java.exe",
        r"C:\Program Files\Android\Android Studio\jbr\bin\java.exe",
    ]:
        if p and os.path.isfile(p):
            return p
    # glob microsoft jdk
    base = r"C:\Program Files\Microsoft"
    if os.path.isdir(base):
        for name in os.listdir(base):
            cand = os.path.join(base, name, "bin", "java.exe")
            if os.path.isfile(cand):
                return cand
    base = r"C:\Program Files\Eclipse Adoptium"
    if os.path.isdir(base):
        for name in os.listdir(base):
            cand = os.path.join(base, name, "bin", "java.exe")
            if os.path.isfile(cand):
                return cand
    return None

def install_jdk():
    java = find_java()
    if java:
        print("java already:", java, flush=True)
        return java
    print("installing Microsoft OpenJDK 17 via winget...", flush=True)
    r = subprocess.run([
        "winget", "install", "--id", "Microsoft.OpenJDK.17", "-e",
        "--accept-package-agreements", "--accept-source-agreements",
        "--disable-interactivity"
    ])
    if r.returncode not in (0, 2316632107):  # 2316632107 = already installed sometimes
        # try temurin
        r = subprocess.run([
            "winget", "install", "--id", "EclipseAdoptium.Temurin.17.JDK", "-e",
            "--accept-package-agreements", "--accept-source-agreements",
            "--disable-interactivity"
        ])
        if r.returncode != 0:
            raise SystemExit("could not install a JDK. Install Microsoft OpenJDK 17 and rerun.")
    java = find_java()
    if not java:
        raise SystemExit("JDK installed but java.exe not found. Open a new terminal and retry.")
    return java

def java_home(java_exe):
    # .../bin/java.exe -> home
    return os.path.dirname(os.path.dirname(java_exe))

def install_sdk():
    os.makedirs(SDK, exist_ok=True)
    latest = os.path.join(SDK, "cmdline-tools", "latest")
    sdkmanager = os.path.join(latest, "bin", "sdkmanager.bat")
    if not os.path.isfile(sdkmanager):
        zpath = os.path.join(SDK, "cmdline-tools.zip")
        print("downloading Android command-line tools...", flush=True)
        urllib.request.urlretrieve(TOOLS_ZIP, zpath)
        tmp = os.path.join(SDK, "_cmdline_tmp")
        if os.path.isdir(tmp):
            shutil.rmtree(tmp)
        with zipfile.ZipFile(zpath) as z:
            z.extractall(tmp)
        dest_parent = os.path.join(SDK, "cmdline-tools")
        os.makedirs(dest_parent, exist_ok=True)
        if os.path.isdir(latest):
            shutil.rmtree(latest)
        # zip contains cmdline-tools/{bin,lib,...}
        inner = os.path.join(tmp, "cmdline-tools")
        if os.path.isdir(inner):
            shutil.move(inner, latest)
        else:
            shutil.move(tmp, latest)
            tmp = None
        if tmp and os.path.isdir(tmp):
            shutil.rmtree(tmp, ignore_errors=True)
        os.remove(zpath)
    if not os.path.isfile(sdkmanager):
        raise SystemExit("sdkmanager missing after extract")
    return sdkmanager

def sdk_packages(sdkmanager, env):
    pkgs = ["platform-tools", "platforms;android-36", "build-tools;36.0.0"]
    print("accepting Android licenses...", flush=True)
    proc = subprocess.Popen(
        [sdkmanager, f"--sdk_root={SDK}", "--licenses"],
        stdin=subprocess.PIPE, env=env, text=True
    )
    proc.communicate("y\n" * 80)
    print("installing Android platforms/build-tools (this is the heavy download, not Studio)...", flush=True)
    run([sdkmanager, f"--sdk_root={SDK}", "--install", *pkgs], env=env)

def write_local_props():
    path = os.path.join(ANDROID, "local.properties")
    with open(path, "w", encoding="utf-8") as f:
        f.write("sdk.dir=" + SDK.replace("\\", "\\\\") + "\n")
    print("wrote", path, flush=True)

def ensure_keystore(env):
    jks = os.path.join(ANDROID, "upload.jks")
    props = os.path.join(ANDROID, "keystore.properties")
    keytool = os.path.join(env["JAVA_HOME"], "bin", "keytool.exe")
    if os.path.isfile(jks) and os.path.isfile(props):
        print("keystore already exists", flush=True)
        return
    pw = secrets.token_urlsafe(18)
    run([
        keytool, "-genkeypair", "-v",
        "-keystore", jks,
        "-keyalg", "RSA", "-keysize", "2048", "-validity", "10000",
        "-alias", "upload",
        "-storepass", pw, "-keypass", pw,
        "-dname", "CN=Ghost Escape, OU=Game, O=Ghost Escape, L=Unknown, ST=Unknown, C=PK"
    ], env=env)
    with open(props, "w", encoding="utf-8") as f:
        f.write(f"storeFile=upload.jks\nstorePassword={pw}\nkeyAlias=upload\nkeyPassword={pw}\n")
    print("CREATED upload keystore. BACK UP android/upload.jks and android/keystore.properties forever.", flush=True)

def build(env):
    os.makedirs(DIST, exist_ok=True)
    gradlew = os.path.join(ANDROID, "gradlew.bat")
    run([gradlew, "bundleRelease", "--no-daemon"], env=env, cwd=ANDROID)
    src = os.path.join(ANDROID, "app", "build", "outputs", "bundle", "release", "app-release.aab")
    dst = os.path.join(DIST, "GhostEscape-1.0.aab")
    if not os.path.isfile(src):
        raise SystemExit("AAB not found at " + src)
    shutil.copyfile(src, dst)
    print("AAB ready:", dst, "size", os.path.getsize(dst), flush=True)

def main():
    java = install_jdk()
    env = os.environ.copy()
    env["JAVA_HOME"] = java_home(java)
    env["ANDROID_HOME"] = SDK
    env["ANDROID_SDK_ROOT"] = SDK
    env["PATH"] = os.path.join(env["JAVA_HOME"], "bin") + os.pathsep + env["PATH"]
    print("JAVA_HOME", env["JAVA_HOME"], flush=True)
    sdkmanager = install_sdk()
    sdk_packages(sdkmanager, env)
    write_local_props()
    ensure_keystore(env)
    build(env)

if __name__ == "__main__":
    main()
