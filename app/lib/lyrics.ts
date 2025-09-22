// app/lib/lyrics.ts
type SongLyricsMap = Record<string, string>;

/**
 * Map id bài hát -> lyric (nhiều dòng).
 * Khi có lời, dán vào chuỗi theo đúng id.
 */
export const LYRICS: SongLyricsMap = {
  '1': `Demo Song Lyrics

[Verse 1]
Đây là dòng lyric đầu tiên
Đây là dòng lyric thứ hai

[Chorus]
Hát vang lên, la la la 🎶
Một khúc ca cho cuộc đời

[Verse 2]
Tiếp tục thêm vài câu nữa
Để bạn thấy lyric hiển thị nè
`,
  '2': ``,
  '3': ``,
};

export function getLyricsById(id?: string) {
  if (!id) return '';
  return LYRICS[id] ?? '';
}
