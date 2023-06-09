class Rect {
    static addMargin(rect, margin) {
        rect.x -= margin;
        rect.y -= margin;
        rect.width += margin * 2;
        rect.height += margin * 2; 
    }
}