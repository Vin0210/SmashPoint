import os, zipfile

base = os.path.join("deploy", "htdocs")
app_zip = os.path.join("deploy", "smashpoint-app.zip")
vendor_zip = os.path.join("deploy", "core-vendor.zip")

for z in (app_zip, vendor_zip):
    if os.path.exists(z):
        os.remove(z)

za = zipfile.ZipFile(app_zip, "w", zipfile.ZIP_DEFLATED)
zv = zipfile.ZipFile(vendor_zip, "w", zipfile.ZIP_DEFLATED)

n_app = n_vendor = 0
for root, dirs, files in os.walk(base):
    for f in files:
        full = os.path.join(root, f)
        rel = os.path.relpath(full, base).replace(os.sep, "/")
        if rel.startswith("core/vendor/"):
            zv.write(full, rel)
            n_vendor += 1
        else:
            za.write(full, rel)
            n_app += 1

za.close()
zv.close()
print("app:", n_app, "->", app_zip, round(os.path.getsize(app_zip)/1048576.0, 2), "MB")
print("vendor:", n_vendor, "->", vendor_zip, round(os.path.getsize(vendor_zip)/1048576.0, 2), "MB")
