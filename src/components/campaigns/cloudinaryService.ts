import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'djjlfrjve',
  api_key: '249651973694211',
  api_secret: '5Eeyk6pZOP9aZaqcKZkJyVsjM1Q',
});

export const cloudinaryService = {
  async uploadImage(file: File): Promise<string> {
    const result = await cloudinary.uploader.upload(file, {
      folder: 'email-templates',
    });
    return result.secure_url;
  },
};