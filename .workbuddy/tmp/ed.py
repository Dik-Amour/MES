import subprocess, sys, os, json

SKILL = r"C:\Program Files\WorkBuddy\resources\app.asar.unpacked\resources\plugins\workbuddy-builtin\skills\tencent-local-office-edit"
PY = r"C:\Users\DONGC\.workbuddy\binaries\python\versions\3.13.12\python.exe"

def run(args):
    p = subprocess.run([PY, "edsdk.py"] + args, cwd=SKILL, capture_output=True)
    out = p.stdout.decode("utf-8", "replace")
    err = p.stderr.decode("utf-8", "replace")
    # strip noisy shim warnings
    err = "\n".join(l for l in err.splitlines() if "shell-runtime-bash-env" not in l and "command not found" not in l)
    return out, err

if __name__ == "__main__":
    args = sys.argv[1:]
    out, err = run(args)
    sys.stdout.write(out)
    if err.strip():
        sys.stderr.write("\n[STDERR]\n" + err)
