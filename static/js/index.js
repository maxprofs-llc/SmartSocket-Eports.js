(function () {
    var elements = document.querySelectorAll(".email"),
        element, email, i;

    for (i = 0; i < elements.length; i += 1) {
        element = elements[i];

        if (element.className.indexOf("spaced") !== -1) {
            email = element.textContent.replace(" at ", " @ ");
        } else {
            email = element.textContent.replace(" at ", "@");
        }

        element.textContent = element.textContent.replace(" at ", "@");
        element.setAttribute("href", "mailto:" + email);
    }
})();