# 🌐 Caelum – Yapay Zekâ Destekli Erişilebilirlik Asistanı

Caelum, web sayfalarını erişilebilirlik açısından analiz eden ve farklı erişilebilirlik ihtiyaçlarına yönelik kullanıcı destekleri sunan bir Chrome uzantısıdır.

Proje; görme, işitme, bilişsel ve motor erişilebilirlik ihtiyaçlarını dikkate alarak web deneyimini daha erişilebilir ve anlaşılır hale getirmeyi amaçlamaktadır.

## ✨ Özellikler

- ♿ Web sayfalarının erişilebilirlik analizi
- 📊 Görsel, işitsel, bilişsel ve motor erişilebilirlik değerlendirmesi
- 🗺️ Erişilebilirlik ve risk haritası
- 🧭 Sayfada kaybolma / yönelim problemi tespiti
- 🔊 Metinleri sesli okuma
- 🤖 Yapay zekâ destekli metin sadeleştirme
- 🖼️ Yapay zekâ destekli alternatif metin (alt text) oluşturma
- ⌨️ Klavye erişilebilirliği desteği
- 🎯 Odak desteği
- 🔍 Yakınlaştırma ve okunabilirlik desteği
- 🎨 Kontrast ve renk düzenleme seçenekleri
- 📖 Tek tuşla erişilebilirlik rehberi

## 🧠 Yapay Zekâ

Caelum'da yapay zekâ, tüm işlemlerin yerine kullanılmak yerine gerekli görülen erişilebilirlik özelliklerinde destekleyici olarak kullanılmaktadır.

Kullanılan yapay zekâ hizmetleri:

- Google Gemini API
- OpenRouter API

Yapay zekâ; özellikle metin sadeleştirme, anlamsal değerlendirme ve alternatif metin oluşturma gibi işlemlerde kullanılmaktadır.

## 🏗️ Teknik Yapı

Caelum, Chrome Extension Manifest V3 mimarisi kullanılarak geliştirilmiştir.

### Kullanılan teknolojiler

- JavaScript
- HTML5
- CSS3
- Chrome Extension Manifest V3
- Chrome Storage API
- Content Scripts
- Service Worker
- Shadow DOM
- Google Gemini API
- OpenRouter API

## 🔎 Erişilebilirlik Analizi

Caelum web sayfasının DOM yapısını analiz ederek;

- Görsellerin alternatif metinlerini
- Başlık hiyerarşisini
- Navigasyon yapılarını
- Etkileşimli öğeleri
- Odaklanabilir öğeleri
- Sayfa içi yapısal özellikleri

değerlendirebilir.

Ayrıca kullanıcı etkileşimlerinden elde edilen anonimleştirilmiş sinyaller kullanılarak sayfada yönelim ve erişilebilirlik problemlerinin tespit edilmesi hedeflenmektedir.

## 👥 Geliştiriciler

**Hümeyra Artut**  
Computer Engineer — [GitHub](https://github.com/humeyra-artut)

**Pınar Çamoğlu**  
Co-Developer — [GitHub](https://github.com/PinarCamoglu)

Caelum ortak olarak geliştirilmiştir.

## 🎯 Projenin Amacı

Caelum'un temel amacı, farklı erişilebilirlik ihtiyaçlarına sahip kullanıcıların web üzerindeki bilgiye daha kolay, anlaşılır ve bağımsız şekilde erişebilmesine yardımcı olmaktır.

Proje, erişilebilirlik analizini ve kullanıcıya yönelik erişilebilirlik desteklerini tek bir Chrome uzantısı içerisinde birleştirmeyi amaçlamaktadır.

## 🚀 Kurulum

1. Bu repository'yi bilgisayarınıza indirin.
2. Chrome'da `chrome://extensions/` adresini açın.
3. Sağ üstten **Geliştirici modu**nu etkinleştirin.
4. **Paketlenmemiş öğe yükle** seçeneğine tıklayın.
5. Caelum proje klasörünü seçin.
6. Uzantıyı Chrome üzerinden kullanmaya başlayın.

## 🔐 Gizlilik

Caelum'un veri işleme uygulamaları hakkında ayrıntılı bilgi için:

**Caelum Gizlilik Politikası**

https://sites.google.com/view/caelum-gizlilik-politikasi/ana-sayfa

## 📌 Proje Durumu

Caelum aktif olarak geliştirilmektedir.

Yeni erişilebilirlik özellikleri, analiz yöntemleri ve yapay zekâ destekli özellikler geliştirme sürecinde eklenmektedir.
