function splitWithMatches(regex, text) {
    // const regex = new RegExp(patterns.map(p => `(${p})`).join('|'), 'g');
    let result = [];
    let lastIndex = 0;
    let replaced = false;
    text.replace(regex, (match, ...args) => {
        const index = args[args.length - 2]; // 一致した位置

        // 一致する前の文字列を追加
        if (lastIndex < index) {
            result.push(text.slice(lastIndex, index));
        }

        // 一致部分をオブジェクトとして追加
        result.push({ match });
        replaced = true;

        // 検索位置を更新
        lastIndex = index + match.length;
    });

    // 最後の部分を追加（もし残っていれば）
    if (lastIndex < text.length) {
        result.push(text.slice(lastIndex));
    }
    return {result, replaced};
}

function readInput(input) {
    const nodes = input.childNodes;
    let datas = [];
    let tmp;
    let replaced = false;

    nodes.forEach(node => {
        if (node.nodeType === 3) { // then "string"
            tmp = splitWithMatches(window.catesRegex,node.textContent.trim());
            if (!replaced) replaced = tmp.replaced;
            datas = datas.concat( tmp.result )
        } else if (node.nodeType === 1 ) {
            datas.push({ match: node.alt})
        }
    });
    return {datas, replaced};
}

// YouTubeのURL変更を監視し、チャットフレームを取得
function observeChatFrame() {
    let lastUrl = location.href;

    function checkUrlChange() {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            waitForChatFrame();
        }
    }
    setInterval(checkUrlChange, 1000);
}

function replaceInputToStamp(input, input2, emojiCates) {
    const tmp = readInput(input2);
    datas = tmp.datas
    replaced = tmp.replaced
    if (replaced) {
        input.setText("");
        insertStrings(datas, input, emojiCates);
    }
}

function waitForChatFrame() {
    // console.log("チャットフレームを探しています...");
    const chatFrame = document.querySelector("iframe#chatframe");

    if (chatFrame) {
        chatFrame.addEventListener("load", () => {
            console.log("チャットフレームがロードされました！");
            const emojiCates = init(chatFrame);
         });
    } else {
        setTimeout(waitForChatFrame, 1000);
    }
}

function init(iframe) {
    const inputContainer = iframe.contentDocument.querySelector('#panel-pages #input-panel');
    const pickerBtn = inputContainer.querySelector('#top #emoji-picker-button #button button#button');
    const input = inputContainer.querySelector('#top #input-container #input');
    const input2 = inputContainer.querySelector('#top #input-container #input #input');
    const emojiCates = inputContainer.querySelector('#pickers #categories');
    pickerBtn.click(); pickerBtn.click();

    input2.addEventListener("paste", (event) => {
        if (!("catesRegex" in globalThis)) window.catesRegex = getEmojiAltsRegex(emojiCates);
        replaceInputToStamp(input, input2, emojiCates);
    });
    input2.addEventListener("input", (event) => {
        if (!("catesRegex" in globalThis)) window.catesRegex = getEmojiAltsRegex(emojiCates);
        replaceInputToStamp(input, input2, emojiCates);
    });
    return emojiCates;
}

// function addPasteEvent(targetElement, input, emojiCates) {
//     targetElement.addEventListener("paste", (event) => {
//         event.preventDefault();
//         document.execCommand("insertText", false, "");
//         // クリップボードの内容を取得
//         const pastedText = event.clipboardData.getData("text");
//         if (!("catesRegex" in globalThis)) window.catesRegex = getEmojiAltsRegex(emojiCates);

//         const datas = splitWithMatches(window.catesRegex, pastedText);
//         insertStrings(datas, input, emojiCates);
//     })
// }

function insertStrings(data, input, categoriesEle) {
    data.forEach((item) => {
        if (typeof item === "string") {
            input.insertText(item);
        } else if (typeof item === "object") {
            var button = categoriesEle.querySelector(`[alt="${item.match}"]`);
            if (button) button.click();
        }
    });
}

function getEmojiAltsRegex(emojiCategories) {
    const results = [];
    const elements = emojiCategories.querySelectorAll("yt-emoji-picker-category-renderer");

    for (const element of elements) {
        // `img` 要素をすべて取得し、`alt` プロパティをリストに追加
        const stampImgAlts = Array.from(element.querySelectorAll("img"))
              .map(img => img.alt)
              .filter(alt => alt); // `alt` が空のものは除外
        results.push(...stampImgAlts);

        // break at aria-label="YouTube"
        if (element.getAttribute("aria-label") === "YouTube") {
            break;
        }

    }
    // 逆ソート（降順）
    results.sort((a, b) => b.localeCompare(a));
    const regex = new RegExp( results.map(p => `(${p})`).join('|'), 'g');
    return regex;
}

observeChatFrame();
waitForChatFrame();
