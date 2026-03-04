
import re

# Hapus semua pola "= {}" dan "= []" yang merupakan default parameter
# tapi JAGA yang merupakan assignment biasa seperti "var x = {}" atau "body = {}"
# Pola default param ada di function signature: func(action, data = {})
# Kita ganti hanya yang di dalam tanda kurung fungsi

def clean_default_params(code):
    # Hapus default param: ", varname = {}" atau ", varname = []" di function signature
    code = re.sub(r',\s*(\w+)\s*=\s*\{\}', r', \1', code)
    code = re.sub(r',\s*(\w+)\s*=\s*\[\]', r', \1', code)
    # Hapus juga yang di awal: "function f(data = {})"
    code = re.sub(r'\(\s*(\w+)\s*=\s*\{\}', r'(\1', code)
    return code

config_js2 = clean_default_params(config_js)
auth_js2   = clean_default_params(auth_js)

# Verifikasi ulang - cek konteks "= {}" yang tersisa
# Perlu pastikan "= {}" yang tersisa adalah assignment biasa (var body = {}, bukan default param)
def check_default_params(code, name):
    lines = code.split("\n")
    issues = []
    for i, line in enumerate(lines):
        # Default param pattern: inside function(..., x = {}) or function(x = {})
        if re.search(r'function\s*\w*\s*\([^)]*=\s*[\{\[]', line):
            issues.append("  Baris %d: %s" % (i+1, line.strip()))
    return issues

print("=== CEK DEFAULT PARAM config.js ===")
issues = check_default_params(config_js2, "config")
print("  BERSIH" if not issues else "\n".join(issues))

print("=== CEK DEFAULT PARAM auth.js ===")
issues2 = check_default_params(auth_js2, "auth")
print("  BERSIH" if not issues2 else "\n".join(issues2))

# Cek semua bahaya lain
danger = ["`", "=>", "async "]
print()
for fname, code in [("config.js", config_js2), ("auth.js", auth_js2)]:
    all_ok = True
    for d in danger:
        if d in code:
            print("  %s MASIH ADA: %s" % (fname, d))
            all_ok = False
    if all_ok:
        print("  %s: SEMUA BERSIH" % fname)

# Simpan final
with open("config.js", "w", encoding="utf-8", newline="\n") as f:
    f.write(config_js2)
with open("auth.js", "w", encoding="utf-8", newline="\n") as f:
    f.write(auth_js2)

print("\nFile disimpan!")
print("config.js:", len(config_js2), "chars")
print("auth.js  :", len(auth_js2), "chars")
