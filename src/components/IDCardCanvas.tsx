import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface IDCardCanvasProps {
  student: any;
  loginPayload?: string;
  width?: number;
  height?: number;
}

export const IDCardCanvas: React.FC<IDCardCanvasProps> = ({ student, loginPayload, width = 856, height = 540 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const imagesRef = useRef<{ [key: string]: HTMLImageElement }>({});

  const svgPaths: Record<string, Path2D> = {
    instagram: new Path2D("M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"),
    github: new Path2D("M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"),
    whatsapp: new Path2D("M12 2C6.48 2 2 6.48 2 12c0 2.17.7 4.19 1.88 5.83L2.5 21.5l3.82-1.33C7.88 21.24 9.87 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.83 0-3.53-.52-4.98-1.42l-.36-.22-2.27.79.79-2.21-.24-.38C3.99 15.1 3.5 13.6 3.5 12c0-4.69 3.81-8.5 8.5-8.5s8.5 3.81 8.5 8.5-3.81 8.5-8.5 8.5zm4.61-6.33c-.25-.13-1.5-.74-1.73-.83-.23-.08-.4-.13-.57.13-.17.25-.66.83-.81 1-.15.17-.3.19-.55.07-.25-.13-1.07-.39-2.04-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.38.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.44-.06-.13-.57-1.37-.78-1.88-.2-.49-.41-.42-.57-.43-.15-.01-.32-.01-.49-.01-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.5-.61 1.71-1.2.21-.59.21-1.09.15-1.2-.06-.11-.23-.17-.48-.3z"),
    tiktok: new Path2D("M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.88 2.89 2.89 0 01-2.89-2.88 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.12V9.41a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.05a8.28 8.28 0 004.77 1.5V7.1a4.84 4.84 0 01-1.01-.41z"),
    facebook: new Path2D("M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"),
    telegram: new Path2D("M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.536-.195 1.006.128.832.942z")
  };

  const getHexLuminance = (hex: string) => {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };

  useEffect(() => {
    const loadImages = async () => {
      const urls = {
        logoWeb: '/gambar/favicon.png',
        logoSchool: '/gambar/logoma.png',
      };

      const loadImage = (url: string) => new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(img);
        img.src = url;
      });

      const [logoWeb, logoSchool, qrDataUrl] = await Promise.all([
        loadImage(urls.logoWeb),
        loadImage(urls.logoSchool),
        QRCode.toDataURL(loginPayload || window.location.origin + '/profile/' + (student.id || student.induk))
      ]);

      let photo: HTMLImageElement | null = null;
      if (student.avatarUrl && typeof student.avatarUrl === 'string' && student.avatarUrl.trim().length > 0) {
        try {
          photo = await loadImage(student.avatarUrl.trim());
        } catch {
          photo = null;
        }
      }

      const qrImg = await loadImage(qrDataUrl);

      imagesRef.current = { logoWeb, logoSchool, photo: photo as any, qrImg };
      setImagesLoaded(true);
    };

    loadImages();
  }, [student.avatarUrl, student.id, student.induk, loginPayload]);

  useEffect(() => {
    if (!imagesLoaded || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = width;
    const H = height;

    const isKepsekStudent = Boolean(
      student.isKepsek || 
      student.id === 'guru-1' || 
      student.nip === '190001' ||
      student.role === 'Kepala Madrasah' ||
      (student.name && student.name.toLowerCase().includes('abdul holik'))
    );

    const colors = student.colors || (
      isKepsekStudent
        ? {
            bg: "#0b0f19",
            primary: "#d97706",
            secondary: "#059669",
            text: "#f8fafc"
          }
        : student.isTeacher
        ? {
            bg: "#f8fafc",
            primary: "#059669",
            secondary: "#0d9488",
            text: "#0f172a"
          }
        : {
            bg: "#f8fafc",
            primary: "#00b837",
            secondary: "#0284c7",
            text: "#0f172a"
          }
    );

    const isDarkBg = getHexLuminance(colors.bg) < 0.45;

    ctx.clearRect(0, 0, W, H);

    // 1. Base Background Fill
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, W, H);

    // 2. Background Watermark Logo Web (Subtle & Non-intrusive)
    const { logoWeb, logoSchool, photo, qrImg } = imagesRef.current;
    if (logoWeb && logoWeb.naturalWidth) {
      ctx.save();
      ctx.globalAlpha = isDarkBg ? 0.04 : 0.025;
      ctx.drawImage(logoWeb, W - 360, H - 320, 340, 340);
      ctx.restore();
    }

    // 3. Top Flowing Sinusoidal Wave Stack
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W, 0);
    ctx.lineTo(W, 125);
    ctx.quadraticCurveTo(W * 0.72, 170, W * 0.42, 110);
    ctx.quadraticCurveTo(W * 0.22, 60, 0, 130);
    ctx.closePath();
    ctx.fillStyle = colors.secondary;
    ctx.globalAlpha = 0.65;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W, 0);
    ctx.lineTo(W, 105);
    ctx.quadraticCurveTo(W * 0.7, 145, W * 0.4, 95);
    ctx.quadraticCurveTo(W * 0.2, 45, 0, 115);
    ctx.closePath();
    ctx.fillStyle = colors.primary;
    ctx.globalAlpha = 1.0;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(W, H);
    ctx.lineTo(W - 220, H);
    ctx.quadraticCurveTo(W - 140, H - 70, W - 60, H - 40);
    ctx.quadraticCurveTo(W - 20, H - 20, W, H - 80);
    ctx.closePath();
    ctx.fillStyle = colors.secondary;
    ctx.globalAlpha = 0.25;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(W, H);
    ctx.lineTo(W - 160, H);
    ctx.quadraticCurveTo(W - 90, H - 45, W - 40, H - 25);
    ctx.quadraticCurveTo(W - 10, H - 15, W, H - 50);
    ctx.closePath();
    ctx.fillStyle = colors.primary;
    ctx.globalAlpha = 0.35;
    ctx.fill();
    ctx.restore();

    // 4. Header School Logo + Text
    const schoolLogoSize = 76;
    const schoolLogoX = 45;
    const schoolLogoY = 10;

    if (logoSchool && logoSchool.naturalWidth) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(schoolLogoX + schoolLogoSize / 2, schoolLogoY + schoolLogoSize / 2, schoolLogoSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        
        const padding = 4;
        const drawSize = schoolLogoSize - (padding * 2);
        const drawX = schoolLogoX + padding;
        const drawY = schoolLogoY + padding;
        
        const imgRatio = logoSchool.naturalWidth / logoSchool.naturalHeight;
        let dw = drawSize;
        let dh = drawSize;
        let dx = drawX;
        let dy = drawY;
        if (imgRatio > 1) {
            dh = drawSize / imgRatio;
            dy = drawY + (drawSize - dh) / 2;
        } else if (imgRatio < 1) {
            dw = drawSize * imgRatio;
            dx = drawX + (drawSize - dw) / 2;
        }
        
        ctx.drawImage(logoSchool, dx, dy, dw, dh);
        ctx.restore();
    }

    const headerTextX = (logoSchool && logoSchool.naturalWidth) ? schoolLogoX + schoolLogoSize + 16 : 45;

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('MA NU ISLAMIYAH ASEMBAGUS', headerTextX, 42);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '800 11.5px "JetBrains Mono", monospace';
    const subHeaderText = isKepsekStudent
      ? `KARTU IDENTITAS KEPALA MADRASAH • AY 2026/2027`
      : student.isTeacher 
      ? `KARTU IDENTITAS PENDIDIK • AY 2026/2027`
      : `KARTU SISWA DIGITAL • AY 2026/2027`;
    ctx.fillText(subHeaderText, headerTextX, 64);

    // 5. Shield Web Logo Badge
    const logoR = 38;
    const logoX = W - logoR - 45;
    const logoY = 48;

    ctx.save();
    ctx.beginPath();
    ctx.arc(logoX, logoY, logoR, 0, Math.PI * 2);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 3;
    ctx.stroke();

    if (logoWeb && logoWeb.naturalWidth) {
        const iconS = logoR * 1.35;
        ctx.drawImage(logoWeb, logoX - iconS / 2, logoY - iconS / 2, iconS, iconS);
    }
    ctx.restore();

    // 6. Photo Backdrop Elements
    const px = 165;
    const py = 305;
    const pr = 105;

    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, pr + 24, 0, Math.PI * 2);
    ctx.fillStyle = colors.secondary;
    ctx.globalAlpha = isDarkBg ? 0.2 : 0.12;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(px, py, pr + 16, Math.PI * 0.15, Math.PI * 0.85);
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.globalAlpha = 0.9;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(px, py, pr + 16, Math.PI * 1.05, Math.PI * 1.75);
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(px, py, pr + 22, -Math.PI * 0.2, Math.PI * 0.35);
    ctx.strokeStyle = colors.secondary;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.globalAlpha = 0.75;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(px, py, pr + 22, Math.PI * 0.5, Math.PI * 1.1);
    ctx.strokeStyle = colors.secondary;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(px, py, pr + 22, Math.PI * 1.25, Math.PI * 1.65);
    ctx.strokeStyle = colors.secondary;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();

    // 7. Student Photo Frame
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, pr + 5, 0, Math.PI * 2);
    ctx.fillStyle = colors.bg;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.clip();

    if (photo && photo.naturalWidth) {
        const imgRatio = photo.naturalWidth / photo.naturalHeight;
        let sx, sy, sWidth, sHeight;
        if (imgRatio > 1) {
            sHeight = photo.naturalHeight;
            sWidth = photo.naturalHeight;
            sx = (photo.naturalWidth - sWidth) / 2;
            sy = 0;
        } else {
            sWidth = photo.naturalWidth;
            sHeight = photo.naturalWidth;
            sx = 0;
            sy = (photo.naturalHeight - sHeight) / 2;
        }
        ctx.drawImage(photo, sx, sy, sWidth, sHeight, px - pr, py - pr, pr * 2, pr * 2);
    } else {
        // Profil Kosong (Clean Blank Profile Avatar Silhouette)
        ctx.fillStyle = isDarkBg ? "#1e293b" : "#f1f5f9";
        ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2);

        // Head circle
        ctx.fillStyle = isDarkBg ? "#475569" : "#cbd5e1";
        ctx.beginPath();
        ctx.arc(px, py - 20, pr * 0.38, 0, Math.PI * 2);
        ctx.fill();

        // Shoulders & Torso curve
        ctx.beginPath();
        ctx.arc(px, py + pr + 15, pr * 0.72, Math.PI, 0, false);
        ctx.fill();

        // Subtle "Belum Ada Foto" watermark indicator
        ctx.fillStyle = isDarkBg ? "rgba(255,255,255,0.4)" : "rgba(100,116,139,0.7)";
        ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PROFIL KOSONG', px, py + pr - 30);
    }
    ctx.restore();

    // 8. Role Pill Badge
    const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.arcTo(x, y, x + width, y, radius);
        ctx.closePath();
    };

    ctx.fillStyle = colors.primary;
    drawRoundedRect(ctx, px - 75, py + pr - 18, 150, 34, 17);
    ctx.fill();
    ctx.strokeStyle = colors.bg;
    ctx.lineWidth = 2.5;
    drawRoundedRect(ctx, px - 75, py + pr - 18, 150, 34, 17);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 11.5px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    const roleBadgeText = isKepsekStudent
      ? 'KEPALA MADRASAH'
      : student.isTeacher
      ? (student.jabatan || student.title || student.role || 'DEWAN PENDIDIK').toUpperCase()
      : (student.role || 'Anggota Aktif').toUpperCase();
    ctx.fillText(roleBadgeText, px, py + pr + 3);

    // 9. Main Content Area
    const tx = 310;
    let currY = 178;

    ctx.fillStyle = colors.primary;
    ctx.font = '800 13.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    const userDisplayTag = student.username 
      ? (student.username.startsWith('@') ? student.username : `@${student.username}`) 
      : (student.isTeacher ? `@${student.id}` : `ID-${student.id ? student.id.slice(0, 8) : 'MEMBER'}`);
    ctx.fillText(`// USER: ${userDisplayTag}`, tx, currY);

    currY += 36;
    ctx.fillStyle = colors.text;
    
    let nameFontSize = 32;
    ctx.font = `800 ${nameFontSize}px "Plus Jakarta Sans", sans-serif`;
    const maxNameWidth = W - tx - 40;
    while (ctx.measureText(student.name || 'Siswa').width > maxNameWidth && nameFontSize > 18) {
        nameFontSize -= 2;
        ctx.font = `800 ${nameFontSize}px "Plus Jakarta Sans", sans-serif`;
    }
    ctx.fillText(student.name || 'Siswa', tx, currY);

    currY += 28;
    if (student.isTeacher) {
      ctx.fillStyle = colors.text;
      ctx.globalAlpha = 0.75;
      ctx.font = '700 13.5px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`Amanah: `, tx, currY);
      ctx.globalAlpha = 1.0;

      ctx.fillStyle = colors.primary;
      ctx.font = '800 14.5px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(student.jabatan || student.title || 'Pendidik', tx + 70, currY);

      if (student.nip) {
        ctx.fillStyle = colors.text;
        ctx.globalAlpha = 0.75;
        ctx.font = '700 13.5px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(`NIP: `, tx + 200, currY);
        ctx.globalAlpha = 1.0;

        ctx.fillStyle = colors.text;
        ctx.font = '800 14px "JetBrains Mono", monospace';
        ctx.fillText(String(student.nip), tx + 238, currY);
      }
    } else {
      ctx.fillStyle = colors.text;
      ctx.globalAlpha = 0.75;
      ctx.font = '700 13.5px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`Panggilan: `, tx, currY);
      ctx.globalAlpha = 1.0;

      ctx.fillStyle = colors.primary;
      ctx.font = '800 14.5px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(student.nickname || (student.name || 'Siswa').split(' ')[0], tx + 85, currY);

      ctx.fillStyle = colors.text;
      ctx.globalAlpha = 0.75;
      ctx.font = '700 13.5px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`Kelas: `, tx + 200, currY);
      ctx.globalAlpha = 1.0;

      ctx.fillStyle = colors.text;
      ctx.font = '800 14.5px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(student.classRoom || 'IPS 1', tx + 248, currY);
    }

    currY += 34;
    let tagX = tx;
    const defaultTeacherTags = ['DEWAN PENDIDIK', ...(student.mapel ? [`MAPEL: ${student.mapel.toUpperCase()}`] : ['MA NU ISLAMIYAH'])];
    const tags = student.tags || (student.isTeacher ? defaultTeacherTags : ['PORTAL DIGITAL ANGKATANKU', 'SATU KELUARGA']);
    tags.slice(0, 3).forEach((tag: string) => {
        ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
        const tagW = ctx.measureText(tag).width + 20;
        if (tagX + tagW > W - 110) return;

        ctx.fillStyle = colors.primary;
        ctx.globalAlpha = isDarkBg ? 0.18 : 0.12;
        drawRoundedRect(ctx, tagX, currY, tagW, 25, 8);
        ctx.fill();

        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 1.5;
        drawRoundedRect(ctx, tagX, currY, tagW, 25, 8);
        ctx.stroke();

        ctx.fillStyle = colors.text;
        ctx.fillText(tag, tagX + 10, currY + 16);

        tagX += tagW + 8;
    });

    currY += 36;
    const quoteW = W - tx - 130;
    const quoteH = 58;

    ctx.fillStyle = isDarkBg ? "rgba(15, 23, 42, 0.45)" : "rgba(255, 255, 255, 0.85)";
    drawRoundedRect(ctx, tx, currY, quoteW, quoteH, 12);
    ctx.fill();

    ctx.strokeStyle = colors.secondary;
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, tx, currY, quoteW, quoteH, 12);
    ctx.stroke();

    ctx.fillStyle = colors.text;
    ctx.font = 'italic 600 11.5px "Plus Jakarta Sans", sans-serif';
    const quoteWords = (`"${student.quote || 'Motto hidup belum ditambahkan.'}"`).split(' ');
    let line1 = '', line2 = '';
    const maxQW = quoteW - 24;

    for (let i = 0; i < quoteWords.length; i++) {
        const testLine = line1 + quoteWords[i] + ' ';
        if (ctx.measureText(testLine).width <= maxQW && line2 === '') {
            line1 = testLine;
        } else {
            line2 += quoteWords[i] + ' ';
        }
    }

    if (line2 !== '') {
        if (ctx.measureText(line2).width > maxQW) {
            while (ctx.measureText(line2 + '...').width > maxQW && line2.length > 0) {
                line2 = line2.slice(0, -1);
            }
            line2 += '...';
        }
        ctx.fillText(line1.trim(), tx + 12, currY + 24);
        ctx.fillText(line2.trim(), tx + 12, currY + 42);
    } else {
        ctx.fillText(line1.trim(), tx + 12, currY + 33);
    }

    // 10. Social Media Badges
    currY += quoteH + 12;
    const socials = student.socials || {};
    const activeSocials = [
        { key: 'instagram', val: socials.ig, label: socials.ig },
        { key: 'github', val: socials.github, label: socials.github },
        { key: 'whatsapp', val: socials.wa, label: socials.wa },
        { key: 'tiktok', val: socials.tiktok, label: socials.tiktok }
    ].filter(s => Boolean(s.val));

    if (activeSocials.length > 0) {
        const maxSocRowW = (W - tx - 130);
        
        ctx.font = '700 10.5px "JetBrains Mono", monospace';
        let totalReqW = 0;
        const socItems = activeSocials.map(soc => {
            const socText = soc.label!.startsWith('@') || soc.key === 'whatsapp' ? soc.label : `@${soc.label}`;
            const baseW = ctx.measureText(socText!).width + 30;
            totalReqW += baseW + 6;
            return { soc, socText, baseW };
        });
        totalReqW -= 6;

        let scale = 1.0;
        if (totalReqW > maxSocRowW) {
            scale = Math.max(0.75, maxSocRowW / totalReqW);
        }

        ctx.save();
        ctx.translate(tx, currY);
        ctx.scale(scale, scale);
        
        let sX = 0;
        socItems.forEach(item => {
            ctx.fillStyle = colors.text;
            ctx.globalAlpha = 0.05;
            drawRoundedRect(ctx, sX, 0, item.baseW, 28, 8);
            ctx.fill();

            ctx.globalAlpha = 1.0;
            ctx.fillStyle = colors.text;
            ctx.fillText(item.socText!, sX + 26, 18);

            const drawSvgIcon = (iconKey: string, ix: number, iy: number, size: number, color: string) => {
                const path2d = svgPaths[iconKey];
                if (!path2d) return;
                ctx.save();
                ctx.translate(ix, iy);
                ctx.scale(size / 24, size / 24);
                ctx.fillStyle = color;
                ctx.fill(path2d);
                ctx.restore();
            };

            drawSvgIcon(item.soc.key, sX + 8, 7, 14, colors.primary);
            sX += item.baseW + 6;
        });
        ctx.restore();
    }

    // 11. QR Code
    if (qrImg && qrImg.naturalWidth) {
        const qrSize = 85;
        const qrX = W - qrSize - 45;
        const qrY = currY - 10;
        
        ctx.fillStyle = "#ffffff";
        drawRoundedRect(ctx, qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 8);
        ctx.fill();
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    }

  }, [student, imagesLoaded, width, height]);

  return (
    <canvas ref={canvasRef} width={width} height={height} className="w-full h-auto rounded-xl drop-shadow-2xl" />
  );
};
