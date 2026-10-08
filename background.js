chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {

        if (request.action === "fetchAPI") {

            fetch(request.url, request.options)

                .then(async (response) => {
                    let data = null;

                    try {
                        data = await response.json();
                    } catch (parseError) {
                        data = { error: { message: await response.text().catch(() => "") } };
                    }

                    if (!response.ok) {
                        const apiMessage =
                            data?.error?.message ||
                            data?.message ||
                            "API Hatası";

                        sendResponse({
                            success: false,
                            status: response.status,
                            error: `${response.status}: ${apiMessage}`
                        });

                        return;
                    }

                    sendResponse({
                        success: true,
                        status: response.status,
                        data: data
                    });
                })

                .catch((err) => {

                    sendResponse({
                        success: false,
                        error: err.message
                    });
                });

            return true;
        }
    }
);

if (chrome.action && chrome.action.onClicked) {
    chrome.action.onClicked.addListener((tab) => {
        if (!tab || !tab.id) return;
        chrome.tabs.sendMessage(tab.id, { action: "ea-show-assistant" }, () => {
            // İçerik betiği bu sayfada yoksa sessiz geç.
            if (chrome.runtime.lastError) {
                console.warn("Caelum bu sayfada gösterilemedi:", chrome.runtime.lastError.message);
            }
        });
    });
}
