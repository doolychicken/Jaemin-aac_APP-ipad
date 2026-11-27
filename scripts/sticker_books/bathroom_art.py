"""Clip coordinates for the bathroom sticker photos reused at the vanity."""

BATHROOM_ITEMS_IMAGE = './images/bathroom_book/items.png'
BATHROOM_VANITY_BOXES = {
    'lotion': (15, 275, 205, 615),
    'dryer': (205, 310, 535, 655),
}


def bathroom_photo(image, path, box):
    alpha = image.getchannel('A').crop(box)
    left, top, right, bottom = alpha.point(lambda value: 255 if value > 100 else 0).getbbox()
    return {
        'image': path,
        'sheet': list(image.size),
        'crop': [box[0] + left, box[1] + top, right - left, bottom - top],
    }
