    } catch (e) {
        console.log("Audio xatosi", e);
    }
}

function getCustomModules() {
    return JSON.parse(localStorage.getItem(CUSTOM_MODULES_KEY) || "{}");
}

function setCustomModules(data) {
    localStorage.setItem(CUSTOM_MODULES_KEY, JSON.stringify(data));
