interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
}

class CloudinaryService {
  private async uploadToCloudinary(file: File): Promise<CloudinaryResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload image to Cloudinary');
    }

    return response.json();
  }

  async uploadImage(file: File): Promise<string> {
    try {
      const result = await this.uploadToCloudinary(file);
      return result.secure_url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    // Note: Image deletion should typically be handled through your backend
    // for security reasons, as it requires your API secret
    console.warn('Image deletion should be implemented through your backend');
  }
}

export const cloudinaryService = new CloudinaryService(); 