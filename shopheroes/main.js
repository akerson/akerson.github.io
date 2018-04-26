const player = {
    money: 0,
    workers: 0,
}

$(document).ready(() => {
    const $money = $('.money');
    const $workers = $('.workers');

    function mainLoop() {
        $money.html("$" + player.money);
        $workers.html("Idle Workers: " + player.workers)
    }





    setInterval(mainLoop,10);
});

