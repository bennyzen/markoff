pkgname=markoff
pkgver=0.1.0
pkgrel=1
pkgdesc='Minimal distraction-free Markdown reader & editor'
arch=('x86_64')
url='https://github.com/bennyzen/markoff'
license=('AGPL-3.0-only')
depends=('webkit2gtk-4.1' 'gtk3' 'cairo' 'glib2' 'pango' 'gdk-pixbuf2')
makedepends=('rust' 'cargo' 'nodejs' 'npm' 'patchelf')
source=("$pkgname-$pkgver.tar.gz::https://github.com/bennyzen/markoff/archive/refs/tags/v$pkgver.tar.gz")
sha256sums=('SKIP')

prepare() {
  cd "$pkgname-$pkgver"
  npm ci
}

build() {
  cd "$pkgname-$pkgver"
  npx tauri build --no-bundle
}

package() {
  cd "$pkgname-$pkgver"
  install -Dm755 "src-tauri/target/release/$pkgname" "$pkgdir/usr/bin/$pkgname"
  install -Dm644 "src-tauri/icons/icon.png" "$pkgdir/usr/share/icons/hicolor/512x512/apps/$pkgname.png"
  install -Dm644 /dev/stdin "$pkgdir/usr/share/applications/$pkgname.desktop" <<EOF
[Desktop Entry]
Name=Markoff
Comment=Minimal distraction-free Markdown reader & editor
Exec=markoff %f
Icon=markoff
Terminal=false
Type=Application
Categories=Office;TextEditor;Utility;
MimeType=text/markdown;text/x-markdown;
EOF
}
