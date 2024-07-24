/**
 * blob to base64
 */
export const blobToBase64 = (blob: Blob): Promise<string> => new Promise(resolve => {
  const reader = new FileReader()
  const b64Prefix = /^data:(.*?);base64,/
  reader.onload = () => {
    const result = (reader.result as string).replace(b64Prefix, '')
    resolve(result)
  }
  reader.readAsDataURL(blob)
})