import { createClient } from '@/lib/supabase/client'
export class SupabaseUploadAdapter {
  private loader: any
  private userId: string
  private supabase: any
  private filePath: any

  constructor(loader: any, userId: string) {
    this.loader = loader // CKEditor gives you the file loader
    this.userId = userId
    this.supabase=createClient()
  }

  // CKEditor calls this method to upload the file
  upload() {

  return this.loader.file.then(async (file: File) => {
    if (!file) throw new Error("No file from loader");

    try {
      // Upload file to Supabase
      const filePath = await this.uploadImage(file, this.userId);
      this.filePath = filePath;

      // Get public URL
      const { data } = this.supabase.storage.from("user-uploads").getPublicUrl(filePath);

      return { default: data.publicUrl };
    } catch (err) {
      console.error("Upload failed:", err);
      throw err;
    }
  });
}


  abort() {
    if (this.filePath) {
      // Optionally clean up partial uploads
      this.deleteImage(this.filePath)
    }
  }

  // Custom method to delete explicitly
  async delete() {
    if (this.filePath) {
      await this.deleteImage(this.filePath)
      this.filePath = null
    }
  }

  async uploadImage(file: File, userId: string) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const filePath = `${userId}/${fileName}`

  const { data, error } = await this.supabase.storage
    .from('user-uploads')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

    console.log(data, error);
  if (error) throw error

  return filePath
}
async deleteImage(filePath: string) {
    console.log(this.filePath);
  const { error } = await this.supabase.storage
    .from('user-uploads')
    .remove([filePath])

  if (error) throw error
}

}



