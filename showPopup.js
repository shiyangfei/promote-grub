

(global => {
  displayWidget(window.managed_delivery)
})(window)


function displayWidget(managed_delivery) {
  var el = document.createElement("div");
  const bg = managed_delivery === 'yes' ? 'red' : 'green'
  const text = managed_delivery === 'yes' ? 'IS' : 'IS NOT'
  const color = 'white'
  el.setAttribute("style", `
        position:fixed;
        top: 30px;
        right: 30px;
        color: ${color};
        font-size: 30px;
        background: ${bg};
        border: 1px solid #ccc !important;
        padding: 0.3em 16px;
        border-radius: 15px;
        z-index: 999999;
        max-width: 1000px;
    `);
  el.innerHTML = `<div>Promote Buddy: This restaurant ${text} using grubhub managed delivery</div>`;
  setTimeout(function () {
    document.body.appendChild(el);
    console.log(el)
  }, 500);
  setTimeout(function () {
    el.parentNode.removeChild(el);
  }, 5500);
}