import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
    });
  }

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    multiples: false,
  });

  try {
    const data: any = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(err);
        } else {
          resolve({ fields, files });
        }
      });
    });

    let file: any = data.files.image;

    if (Array.isArray(file)) {
      file = file[0];
    }

    if (!file) {
      return res.status(400).json({
        error: 'No image uploaded',
      });
    }

    const ext = path.extname(file.originalFilename || '.jpg');

    const fileName =
      Date.now() +
      '-' +
      Math.random().toString(36).substring(2, 8) +
      ext;

    const newPath = path.join(uploadDir, fileName);

    fs.renameSync(file.filepath, newPath);

    const imageUrl = `/uploads/${fileName}`;

    return res.status(200).json({
      url: imageUrl,
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      error: error.message,
    });
  }
}