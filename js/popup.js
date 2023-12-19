document.querySelector('.btn--grab').addEventListener('click', (e) => {
    // for getting information from browser tabs:
    // first param: queryObject - set params for searching special tabs,
    // set active to true to get only active tab
    // callback - function that accept tab as args
    chrome.tabs.query({ active: true }, (tabs) => {
        const tab = tabs[0];

        if (tab) {
            execScript(tab);
        } else {
            alert('There is no active tab');
        }
    });
});

const execScript = (tab) => {
    // prevent open in chrome://
    if (tab.url.includes('chrome://')) {
        alert('can`t run on start page');
    } else {
        // Injects a script into a target context.
        // target object: specify tabId and allFrames: true - script has to work
        // on each frame on the page if it exists
        // handleResult - callback will call when script is done
        chrome.scripting.executeScript(
            {
                target: {
                    tabId: tab.id,
                    allFrames: true
                },
                func: grabImages,
            },
            handleResult
        );
    }
};

const grabImages = () => {
    const imgs = document.querySelectorAll('img');

    return Array.from(imgs).map(img => img.src);
};

const handleResult = (frames) => {

    if (!frames.length) {
        alert('Could not retrieve images from specified page');
        return;
    }

    const imgUrls = frames
        .map(frame => frame.result)
        .reduce((acc, item) => acc.concat(item));

    openImgsPage(imgUrls);
};

const openImgsPage = (urls) => {
    // open new browser tab
    // object that access url - url page that needed ot be open
    // active param - set for new open tab
    // callback - some actions with tab
    chrome.tabs.create({
        url: '../html/page.html',
        active: false
    }, (tab) => {
        // prop data to new tab
        setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, urls, () =>
                // make browser tab active
                chrome.tabs.update(tab.id, { active: true }));
        }, 200);
    });
};

