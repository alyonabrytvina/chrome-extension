const insertImgs = (urls) => {
    const container = document.querySelector('list');
    const ul = document.createElement('ul');
    container.appendChild(ul);

    [...urls].forEach(url => {
        const li = document.createElement('li');
        const img = document.createElement('img');
        const checkbox = document.createElement('input');

        li.className = 'li-item';
        img.src = url;
        img.className = 'img-item';

        checkbox.type = 'checkbox';
        checkbox.className = 'checkbox checkbox--item';

        li.appendChild(img);
        li.appendChild(checkbox);
        ul.appendChild(li);
    });
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Use this event to listen for messages from another part of your extension.
    insertImgs(message);
    sendResponse('OK');
});

const checkAll = (checkbox) => {
    const checkboxes = document.querySelectorAll('input[type=\'checkbox\']');

    if (checkbox.checked) {
        checkboxes.forEach((checkbox) => checkbox.checked = true);
    } else {
        checkboxes.forEach((checkbox) => checkbox.checked = false);
    }
};

document.querySelector('.checkbox--all').addEventListener('change', () => {
    checkAll(document.querySelector('.checkbox--all'));
});

const getSelectedUrls = () => {
    const checkboxes = document.querySelectorAll('input[type=\'checkbox\']');
    const arr = [];

    for (let checkbox of [...checkboxes]) {

        if (checkbox.checked) {
            const img = checkbox.previousSibling;

            if (img.src) {
                arr.push(img.src);
            }
        }
    }

    if (!arr.length) {
        throw new Error('Please select at least one image!');
    }

    return arr;
};

const checkAndGetFileName = (index, blob) => {
    let name = parseInt(index) + 1;
    const [type, extension] = blob.type.split('/');
    console.log(type, extension)
    if (type !== 'image' || blob.size <= 0) {
        throw Error('Incorrect content');
    }

    return `${ name }.${ extension }`;
};

const createArchive = async (urls) => {
    const zip = new JSZip();

    for (let index in urls) {
        const url = urls[index];

        try {
            const response = await fetch(url);
            const blob = await response.blob();
            zip.file(checkAndGetFileName(index, blob), blob);
        } catch (e) {
            console.error(e.message);
            return;
        }
    }

    return zip.generateAsync(({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
            level: 9
        }
    }));
};

const downloadArchive = (archive) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(archive);
    link.download = 'images.zip';
    document.body.appendChild(link);

    link.click();
    URL.revokeObjectURL(link.href);
    document.body.removeChild(link);

    document.querySelector('.btn--download').disabled = true;

    setTimeout(() => {
        document.querySelector('.btn--download').disabled = false;
    }, 2000)
};

document.querySelector('.btn--download').addEventListener('click', async () => {
    try {
        const selectedUrls = getSelectedUrls();
        const archive = await createArchive(selectedUrls);

        if(archive) {
            downloadArchive(archive);
        }
    } catch (e) {
        alert(e.message);
    }
});
