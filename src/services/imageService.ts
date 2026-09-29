import { File, Directory, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { randomUUID } from 'expo-crypto';

export const photoDirectory = new Directory(Paths.document, 'photos');
const photoPrefix = photoDirectory.uri.replace(/\/$/, '') + '/';

export async function pickPhoto(camera: boolean): Promise<string | null> {
  const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Allow photo access in device settings to add a photo.');
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8 };
  const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return null;
  const asset = result.assets[0];
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > 1200) context.resize(asset.width > asset.height ? { width: 1200 } : { height: 1200 });
  const image = await context.renderAsync();
  try { return (await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 })).uri; }
  finally { image.release(); context.release(); }
}

export async function persistPhoto(uri: string): Promise<string> {
  if (uri.startsWith(photoPrefix)) return uri;
  photoDirectory.create({ intermediates: true, idempotent: true });
  const destination = new File(photoDirectory, `${randomUUID()}.jpg`);
  try { await new File(uri).copy(destination); }
  catch (err) { removePhoto(destination.uri); throw err; }
  return destination.uri;
}

export function removePhoto(uri: string | null): void {
  if (!uri?.startsWith(photoPrefix)) return;
  try { const file = new File(uri); if (file.exists) file.delete(); }
  catch { /* A leftover file is safer than treating a committed save as failed. */ }
}
