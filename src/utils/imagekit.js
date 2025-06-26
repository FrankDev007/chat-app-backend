import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL,
});


export const uploadImage = async (file, fileName, folder = 'avatars') => {
    try {
        const result = await imagekit.upload({
            file: file, // base64 string or file object
            fileName: fileName, // name of the file to be uploaded
            folder: folder, // optional folder path in ImageKit
            useUniqueFileName: false, // optional, to ensure unique file names
            tags: ["user-avatar"], // optional tags for the image
        })

        return {
            public_id: result.fileId,
            url: result.url,
        }
    } catch (error) {
        throw new Error("Image upload failed: " + error.message);
    }
}

export const deleteImage = async (public_id) => {
    try {
        await imagekit.deleteFile(public_id);
        return { success: true, message: "Image deleted successfully" };
    } catch (error) {
        throw new Error("Image deletion failed: " + error.message); 
    }
}
