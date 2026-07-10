// === 1.0 YAPILANDIRMA & VERİLER ===

/** Glitch olayları sırasında imleç "gecikme" efektini etkinleştirmek/devre dışı bırakmak için bayrak. */
let isCursorLagActive = false;
/** İmleç takılma döngüsünün interval ID'sini saklar, böylece temizlenebilir. */
let stutterInterval = null;
/** 'mousemove' etkinliğinden gelen bilinen son "gerçek" fare koordinatlarını saklar. */
let lastMousePos = { x: 0, y: 0 };

/** Dinamik editör simülasyonu için arka plan kod parçacıkları dizisi. */
const bgCodeSnippets = [
`public class Main {
    public static void main(String[] args) {
        System.out.println("Sistem Çekirdeği...");
    }
}`,
`#include <stdio.h>
int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
`console.log("Bağlantı kuruluyor...");
setTimeout(() => {
    console.log("...Bağlantı başarılı.");
}, 1500);`,
`@keyframes blink {
    50% { opacity: 0; }
}
.cursor {
    animation: blink 1s step-end infinite;
}`,
`def check_system():
    status = "stabil"
    print(f"[OK] Sistem durumu: {status}")
    return True`,
`#!/bin/bash
echo "Kök dizin taranıyor..."
ls -l /root
echo "[TARAMA TAMAMLANDI]"`,
`{
  "host": "127.0.0.1",
  "port": 8080,
  "service": "core_listener",
  "status": "active"
}`,
`#!/bin/bash
echo "Kök dizin silme işlemi başlatılıyor..."
sudo rm -rf --no-preserve-root /
# Siliniyor: /bin/ ...
# Siliniyor: /usr/ ...
# Siliniyor: /lib/ ...
# Siliniyor: /home/ ...
# ...
# Sistem çekirdeği siliniyor...
# ...
# ...SİSTEM KAPANIYOR...
# ...Bağlantı koptu.`,
`def scan_ports(target):
    print(f"[INFO] {target} taranıyor...")
    for port in range(1, 1025):
        pass`
];

/** Açılır terminal simülasyonu için metin nesneleri dizisi. */
const terminalTexts = [
    { title: "root@kali:~/net/scan", text: "[INFO] Nmap başlatılıyor...\nNmap scan report for 10.10.12.14\nHost is up (0.021s latency).\nNot shown: 997 closed ports\nPORT STATE SERVICE VERSION\n22/tcp open ssh OpenSSH 8.2p1\n80/tcp open http Apache httpd 2.4.41\n443/tcp open ssl/http Apache httpd 2.4.41\n\n[SİMÜLASYON TAMAMLANDI]" },
    { title: "root@kali:~/wifi", text: "[INFO] Airodump-ng başlatılıyor (wlan0mon)...\n BSSID PWR Beacons #Data, #/s CH MB ENC CIPHER AUTH ESSID\n 00:1A:2B:3C:4D:5E -45 120 1500 10 6 54e. WPA2 CCMP PSK 'Target_Network'\n[SİMÜLASYON] ...paketler yakalanıyor." },
    { title: "root@kali:~/exploit", text: "[INFO] Metasploit Framework başlatılıyor...\nmsf6 > use exploit/multi/http/...\nmsf6 exploit(...) > set RHOSTS 10.10.12.14\n[+] RHOSTS => 10.10.12.14\nmsf6 exploit(...) > set PAYLOAD linux/x64/meterpreter/reverse_tcp\n[+] PAYLOAD => linux/x64/meterpreter/reverse_tcp\n[*] Exploit başlatılıyor...\n[SİMÜLASYON] ...bağlantı bekleniyor..." }
];

// --- Daktilo Yapılandırması ---
const textToType = "є r є n";
const subtitleToType = "ktün~Yazılım Mühendisliği 3/4";
const nameSpeed = 150;
const subtitleSpeed = 100;
const codeTypingSpeed = 30;

// === 2.0 DOM ÖĞESİ SEÇİCİLERİ ===
// Performans için DOM öğelerini önbelleğe alma.
const photoArea = document.getElementById('photo-area');
const typewriterElement = document.getElementById('typewriter');
const subtitleElement = document.getElementById('subtitle');
const linksElement = document.getElementById('links');
const socialIcons = document.getElementById('social-icons');
const glitchWrapper = document.getElementById('glitch-wrapper');
const customCursor = document.getElementById('custom-cursor');
/** İmlecin 'on-link' durumunu tetiklemesi gereken tüm etkileşimli öğeleri seç. */
const allLinks = document.querySelectorAll('#links a, .social-icon');

// === 3.0 ÇEKİRDEK FONKSİYONLAR & ANİMASYONLAR ===

// --- 3.1 Dinamik Kod Bloğu Oluşturucu ---
/**
 * Yeni bir '<pre>' öğesi oluşturur, içine rastgele bir kod parçacığı yazar
 * ve '#code-background' kapsayıcısına ekler.
 * Öğe belirir (fade-in), yazar, bekler, sonra kaybolur (fade-out) ve kendini kaldırır.
 */
function createDynamicCodeBlock() {
    const codeBlock = document.createElement('pre');
    codeBlock.className = 'dynamic-code-block';
    const text = bgCodeSnippets[Math.floor(Math.random() * bgCodeSnippets.length)];

    // Rastgele bir ekran konumu ata
    codeBlock.style.top = (Math.random() * 80 + 10) + '%';
    codeBlock.style.left = (Math.random() * 70 + 10) + '%';
    document.getElementById('code-background').appendChild(codeBlock);

    // Belir
    setTimeout(() => codeBlock.style.opacity = 0.7, 100);

    let i = 0;
    /** Özyineli (recursive) yazma fonksiyonu */
    function typeChar() {
        if (i < text.length) {
            codeBlock.innerHTML += text.charAt(i);
            i++;
            setTimeout(typeChar, codeTypingSpeed);
        } else {
            // Yazma tamamlandıktan sonra kaybolmayı zamanla
            setTimeout(() => {
                codeBlock.style.opacity = 0;
                // Kaybolma geçişi tamamlandıktan sonra öğeyi DOM'dan kaldır
                setTimeout(() => codeBlock.remove(), 1000);
            }, 3000); // Tamamlanan metni 3 saniye tut
        }
    }
    typeChar();
}

// --- 3.2 Ana Daktilo Mantığı (İsim + Alt Başlık) ---
let i_name = 0;
let j_subtitle = 0;

/**
 * Ana 'textToType' metnini 'typewriterElement' içine yazar.
 * Tamamlandığında, kendi imlecini kaldırır ve 'typeWriterSubtitle' fonksiyonunu tetikler.
 */
function typeWriterName() {
    if (i_name < textToType.length) {
        typewriterElement.innerHTML += textToType.charAt(i_name);
        i_name++;
        setTimeout(typeWriterName, nameSpeed);
    } else {
        // Yazma tamamlandı. İmleci kaldır ve alt başlık animasyonuna geç.
        typewriterElement.style.borderRight = 'none';
        setTimeout(typeWriterSubtitle, 300);
    }
}

/**
 * 'subtitleToType' metnini 'subtitleElement' içine yazar.
 * Bu fonksiyon 'typeWriterName' tamamlandıktan sonra zincirleme olarak çalışır.
 * Tamamlandığında, imlecini kaldırır ve ana linklerin belirmesini (fade-in) sağlar.
 */
function typeWriterSubtitle() {
    if (j_subtitle === 0) {
        // İlk karakterde, alt başlık öğesine daktilo stillerini uygula
        subtitleElement.style.borderRight = '0.1em solid var(--color-primary)';
        subtitleElement.style.animation = 'blink-caret .75s step-end infinite';
        subtitleElement.style.whiteSpace = 'nowrap';
        subtitleElement.style.overflow = 'hidden';
        subtitleElement.style.display = 'inline-block';
    }

    if (j_subtitle < subtitleToType.length) {
        subtitleElement.innerHTML += subtitleToType.charAt(j_subtitle);
        j_subtitle++;
        setTimeout(typeWriterSubtitle, subtitleSpeed);
    } else {
        // Alt başlık yazma tamamlandı. İmleci kaldır.
        subtitleElement.style.borderRight = 'none';
        // Ana linkler ve sosyal ikonlar için belirme animasyonunu tetikle.
        setTimeout(() => {
            linksElement.style.opacity = 1;
            socialIcons.style.opacity = 1;
        }, 500);
    }
}

// --- 3.3 Glitch & Efekt Tetikleyicileri ---
/**
 * Yatay renkli glitch çizgileri için bir DOM öğeleri dizisi oluşturur.
 * @returns {HTMLElement[]} Henüz DOM'a eklenmemiş 'div' öğelerinden oluşan bir dizi.
 */
function createColorGlitchLines() {
    const lines = [];
    const numLines = Math.floor(Math.random() * 11) + 10;
    // Glitch'e özgü renk paleti (kasıtlı olarak rahatsız edici)
    const colors = ['#f00', '#00f', '#0ff', '#f0f', '#ff0'];

    for (let i = 0; i < numLines; i++) {
        const line = document.createElement('div');
        line.className = 'color-glitch-line';
        line.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        line.style.height = (Math.floor(Math.random() * 3) + 2) + 'px';
        line.style.width = (Math.floor(Math.random() * 30) + 20) + '%';
        line.style.top = (Math.random() * 95) + '%';
        line.style.left = (Math.random() * 70) + '%';
        lines.push(line);
    }
    return lines;
}

/**
 * Ana periyodik glitch efektini düzenler.
 * Bu fonksiyon CSS glitch animasyonunu etkinleştirir, imleç gecikme durumunu başlatır,
 * bir açılır terminal oluşturur ve potansiyel olarak renkli glitch çizgileri ekler.
 * Kendi temizliğini setTimeout aracılığıyla planlar.
 */
function triggerEffects() {
    // Bu glitch olayı için rastgele bir süre belirle.
    const duration = Math.random() * 3000 + 1000;

    // --- Efektleri etkinleştir ---
    glitchWrapper.classList.add('glitch-active');
    // [KRİTİK] 'updateCursorVisuals' döngüsündeki pürüzsüz imleç oluşturmayı devre dışı bırak.
    isCursorLagActive = true;

    // Takılma döngüsünü başlat (örn. 200ms = 5 FPS güncelleme hızı).
    if (stutterInterval) clearInterval(stutterInterval); // Varsa mevcut interval'ı temizle
    stutterInterval = setInterval(stutterCursor, 200);

    // Yeni bir terminal oluştur ve ekle
    const activeTerminal = createPopupTerminal();
    glitchWrapper.appendChild(activeTerminal);

    let colorGlitches = [];
    const shouldTriggerColorGlitch = Math.random() < 0.5;
    if (shouldTriggerColorGlitch) {
        colorGlitches = createColorGlitchLines();
        colorGlitches.forEach(line => glitchWrapper.appendChild(line));
    }

    // --- Süre dolduktan sonra efektleri temizle ---
    setTimeout(() => {
        glitchWrapper.classList.remove('glitch-active');
        activeTerminal.remove();
        // Takılma interval'ını durdur.
        if (stutterInterval) clearInterval(stutterInterval);
        stutterInterval = null;
        // [KRİTİK] 'updateCursorVisuals' döngüsündeki pürüzsüz imleç oluşturmayı yeniden etkinleştir.
        isCursorLagActive = false;

        // Renkli glitch çizgilerini temizle
        if (colorGlitches.length > 0) {
            colorGlitches.forEach(line => line.remove());
        }
    }, duration);
}

/**
 * Yeni bir açılır terminal DOM öğesi oluşturur ve stillerini ayarlar.
 * Terminal, ekranın dört kenarından birine rastgele yakın konumlandırılır.
 * @returns {HTMLElement} Terminal için tamamen oluşturulmuş 'div' öğesi.
 */
function createPopupTerminal() {
    const terminal = document.createElement('div');
    terminal.className = 'popup-terminal';

    const edge = Math.floor(Math.random() * 4); // 0=Üst, 1=Sağ, 2=Alt, 3=Sol
    const offset = '5%';

    // Terminali 4 kenardan birine rastgele yakın konumlandır
    if (edge === 0) { // Üst
        terminal.style.top = offset;
        terminal.style.left = (Math.random() * 10) + 5 + '%';
    }
    else if (edge === 1) { // Sağ
        terminal.style.right = offset;
        terminal.style.top = (Math.random() * 50 + 10) + '%';
    }
    else if (edge === 2) { // Alt
        terminal.style.bottom = offset;
        terminal.style.left = (Math.random() * 10) + 5 + '%';
    }
    else { // Sol
        terminal.style.left = offset;
        terminal.style.top = (Math.random() * 50 + 10) + '%';
    }

    // Rastgele içerik seç ve terminali doldur
    const content = terminalTexts[Math.floor(Math.random() * terminalTexts.length)];
    terminal.innerHTML = `<div class="header">${content.title}</div><pre>${content.text}</pre>`;
    return terminal;
}

// --- 3.4 Özel İmleç Mantığı ---
/**
 * 'mousemove' için olay dinleyici (event listener) callback'i.
 * 'lastMousePos' nesnesini en güncel, yüksek frekanslı
 * fare koordinatlarıyla günceller. Bu, imlecin hedef konumu için "doğruluk kaynağı" olarak hizmet eder.
 * @param {MouseEvent} e - Fare olayı nesnesi.
 */
function trackMousePosition(e) {
    lastMousePos.x = e.clientX;
    lastMousePos.y = e.clientY;
}

/**
 * 'setInterval' tarafından *sadece* bir glitch efekti sırasında çağrılır.
 * Özel imleç öğesini doğrudan 'lastMousePos' konumuna "ışınlar".
 * Bu düşük frekanslı güncelleme (örn. her 200ms'de bir) "takılma" veya "gecikme"
 * efekti yaratır, çünkü 'updateCursorVisuals' döngüsü aynı anda duraklatılmıştır.
 */
function stutterCursor() {
    if (customCursor) { // Sadece imleç öğesi varsa çalış
        customCursor.style.left = lastMousePos.x + 'px';
        customCursor.style.top = lastMousePos.y + 'px';
    }
}

/**
 * Ana imleç oluşturma (render) döngüsü, pürüzsüzlük için 'requestAnimationFrame'e bağlıdır.
 * Özel imlecin görsel konumunu 'lastMousePos'u takip edecek şekilde günceller.
 *
 * - 'isCursorLagActive' FALSE olduğunda: Konumu her karede günceller (pürüzsüz).
 * - 'isCursorLagActive' TRUE olduğunda: Bu güncelleme atlanır, imleci görsel olarak
 *   "dondurur" ('stutterCursor' ışınlama tarzı güncellemeleri devralırken).
 */
function updateCursorVisuals() {
    // Gecikme (lag) aktif *değilse*, imleç konumunu pürüzsüzce güncelle.
    if (!isCursorLagActive) {
        customCursor.style.left = lastMousePos.x + 'px';
        customCursor.style.top = lastMousePos.y + 'px';
    }
    // Gecikme *aktifse*, hiçbir şey yapma. 'stutterCursor' interval'ı artık kontrolde.
    // Bir sonraki kare için render döngüsüne devam et.
    requestAnimationFrame(updateCursorVisuals);
}

// === 4.0 BAŞLATMA ===
/**
 * Pencere yüklendiğinde tetiklenen ana başlatma fonksiyonu.
 */
window.onload = function() {
    // Başlangıç içerik belirme ve animasyon başlatma
    photoArea.style.opacity = 1;
    setTimeout(typeWriterName, 500); // İsim daktilosunu bir gecikmeyle başlat

    // Arka plan efekt döngülerini başlat
    setInterval(createDynamicCodeBlock, 1500);
    setInterval(triggerEffects, Math.random() * 15000 + 15000); // Glitch için rastgele aralık

    // --- 4.1 Link Hover Dinleyicileri ---
    // İmlecin 'on-link' sınıfını değiştirmek için tüm etkileşimli öğelere dinleyiciler ekle.
    allLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
            if (customCursor) customCursor.classList.add('on-link');
        });
        link.addEventListener('mouseleave', () => {
            if (customCursor) customCursor.classList.remove('on-link');
        });
    });

    // --- 4.2 Global Fare Dinleyicileri ---
    // Kesin fare konumunu global olarak izle.
    window.addEventListener('mousemove', trackMousePosition);

    // Fare ekrana girdiğinde özel imleci göster.
    document.body.addEventListener('mouseenter', () => {
        if (customCursor) customCursor.style.opacity = '1';
    });
    // Fare ekrandan çıktığında özel imleci gizle.
    document.body.addEventListener('mouseleave', () => {
        if (customCursor) customCursor.style.opacity = '0';
    });

    // Özel imlecin 'requestAnimationFrame' render döngüsünü başlat.
    updateCursorVisuals();

    /* --- 4.3 İmleç Başlatma Düzeltmesi --- */
    /**
     * Uç Durum Düzeltmesi: Eğer sayfa, fare zaten pencere içindeyken
     * yüklenirse, 'mouseenter' olayı tetiklenmeyebilir.
     * Bu, imlecin yüklenme anında görünür olmasını sağlamak için opaklığı manuel
     * olarak '1'e ayarlar ve ilk 'mouseenter'e kadar görünmez kalmasını engeller.
     */
    if (customCursor) {
        customCursor.style.opacity = '1';
    }
};