import defaultBookImage from '../assets/images/default_book_image.jpg'
import defaultAvatar from '../assets/images/default_avatar.jpg'

export const getBookImage = (img) => {
    if (!img) return defaultBookImage;
    return `http://localhost:8080/bookImages/${img}`;
}

export const getUserImage = (img) => {
    if (!img) {
        return defaultAvatar;
    }else if (img.startsWith('http')) {
        return img;
    }
    return `http://localhost:8080/userImages/${img}`;
}