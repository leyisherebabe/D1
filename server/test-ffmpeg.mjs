import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Test FFmpeg pour génération HLS...');

// Créer le dossier de sortie
const outputDir = join(__dirname, 'media', 'live');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Test avec une vidéo de test générée par FFmpeg
const ffmpegPath = 'C:/ffmpeg/bin/ffmpeg.exe';
const outputPath = join(outputDir, 'test.m3u8');

const args = [
  '-f', 'lavfi',
  '-i', 'testsrc=duration=10:size=320x240:rate=30',
  '-f', 'lavfi',
  '-i', 'sine=frequency=1000:duration=10',
  '-c:v', 'libx264',
  '-preset', 'ultrafast',
  '-c:a', 'aac',
  '-f', 'hls',
  '-hls_time', '2',
  '-hls_list_size', '3',
  '-hls_flags', 'delete_segments',
  outputPath
];

console.log('🔧 Commande FFmpeg:', ffmpegPath, args.join(' '));

const ffmpeg = spawn(ffmpegPath, args);

ffmpeg.stdout.on('data', (data) => {
  console.log('📤 FFmpeg stdout:', data.toString());
});

ffmpeg.stderr.on('data', (data) => {
  console.log('📥 FFmpeg stderr:', data.toString());
});

ffmpeg.on('close', (code) => {
  console.log(`🏁 FFmpeg terminé avec le code: ${code}`);
  
  if (fs.existsSync(outputPath)) {
    console.log('✅ Fichier HLS généré avec succès !');
    console.log('📁 Fichier:', outputPath);
  } else {
    console.log('❌ Fichier HLS non généré');
  }
});

ffmpeg.on('error', (error) => {
  console.error('❌ Erreur FFmpeg:', error.message);
});