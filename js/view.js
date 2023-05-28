class View {
    static init() {
        Settings.createHtml('#settings-wrapper');
        document.querySelector('#textarea').value = Model.equation;

        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        ctx.reset();
        ctx.drawImage(Model.blackBoardImg, 0, 0);
    }
}