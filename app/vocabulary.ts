import { translations } from './translations';

export type VocabularyTheme = { id: string; title: string; emoji: string; words: string[] };

export const vocabularyThemes: VocabularyTheme[] = [
  { id: 'fruit', title: 'Buah-buahan', emoji: '🍇', words: ['Anggur','Jeruk','Mangga','Apel','Pisang','Stroberi','Semangka','Melon','Pepaya','Nanas','Kiwi','Alpukat','Kelapa','Durian','Rambutan','Salak','Jambu biji','Lemon'] },
  { id: 'vegetables', title: 'Sayur-sayuran', emoji: '🥕', words: ['Wortel','Bayam','Kangkung','Brokoli','Kubis','Mentimun','Terong','Kentang','Kacang panjang','Selada','Jagung','Tomat','Bawang merah','Bawang putih','Cabai','Labu','Jamur','Kembang kol'] },
  { id: 'home', title: 'Benda di rumah', emoji: '🏠', words: ['Pintu','Jendela','Kursi','Meja','Tempat tidur','Bantal','Selimut','Lemari','Lampu','Jam dinding','Sofa','Karpet','Televisi','Kipas angin','Telepon','Cermin','Tirai','Rak buku'] },
  { id: 'everyday', title: 'Barang yang sering dipakai', emoji: '🎒', words: ['Baju','Celana','Sepatu','Sandal','Kaus kaki','Topi','Tas','Payung','Handuk','Sikat gigi','Jam tangan','Kacamata','Dompet','Sisir','Sabun','Sampo','Masker','Botol minum'] },
  { id: 'kitchen', title: 'Benda di dapur', emoji: '🍳', words: ['Piring','Mangkuk','Gelas','Cangkir','Sendok','Garpu','Panci','Wajan','Kompor','Kulkas','Pisau','Talenan','Ketel','Blender','Serbet','Saringan','Tempat sampah','Pembuka botol'] },
  { id: 'school', title: 'Benda di sekolah', emoji: '📚', words: ['Buku','Pensil','Penghapus','Penggaris','Krayon','Rautan pensil','Tempat pensil','Papan tulis','Spidol','Gunting','Meja belajar','Kursi sekolah','Seragam','Sepatu sekolah','Peta','Globe','Komputer','Bel sekolah'] },
  { id: 'jobs', title: 'Profesi manusia', emoji: '🧑‍⚕️', words: ['Guru','Dokter','Perawat','Dokter gigi','Polisi','Pemadam kebakaran','Koki','Petani','Pilot','Penjahit','Polisi lalu lintas','Astronaut','Nelayan','Tukang pos','Sopir','Arsitek','Ilmuwan','Fotografer'] },
  { id: 'sports', title: 'Barang olahraga', emoji: '⚽', words: ['Bola sepak','Bola basket','Bola voli','Raket bulu tangkis','Kok','Raket tenis','Bola tenis','Sepeda','Helm sepeda','Kacamata renang','Bola pingpong','Meja pingpong','Gawang','Jaring','Peluit','Matras','Tali lompat','Barbel'] },
  { id: 'mammals', title: 'Binatang mamalia', emoji: '🐘', words: ['Kucing','Anjing','Sapi','Kambing','Domba','Kuda','Kelinci','Gajah','Jerapah','Zebra','Monyet','Orangutan','Panda','Beruang','Koala','Kanguru','Lumba-lumba','Paus'] },
  { id: 'predators', title: 'Binatang predator', emoji: '🦁', words: ['Singa','Harimau','Macan tutul','Citah','Serigala','Buaya','Komodo','Hiu','Elang','Burung hantu','Beruang kutub','Rubah','Hyena','Piranha','Ular','Python','Burung nasar','Orca'] },
  { id: 'insects', title: 'Serangga', emoji: '🦋', words: ['Semut','Kupu-kupu','Lebah','Lalat','Nyamuk','Belalang','Capung','Kecoak','Kumbang','Jangkrik','Kunang-kunang','Ulat','Ulat bulu','Rayap','Kutu','Kutu rambut','Belalang sembah','Lebah madu','Tawon','Laron'] },
];

export const vocabularyCount = vocabularyThemes.reduce((sum, theme) => sum + theme.words.length, 0);

export type Word = { id: string; idn: string; en: string; ar: string; image: string; tint: string };
export type LessonTheme = Omit<VocabularyTheme, 'words'> & { words: Word[] };
const tints = ['#f0e9fa', '#fff0d8', '#e8f3dc', '#ffebeb', '#e7efff'];

export const lessonThemes: LessonTheme[] = vocabularyThemes.map(theme => ({
  ...theme,
  words: theme.words.map((idn, index) => {
    const translation = translations[theme.id]?.[index];
    if (!translation) throw new Error(`Missing translation: ${theme.id}/${index}`);
    const id = `${theme.id}-${String(index + 1).padStart(2, '0')}`;
    return { id, idn, en: translation[0], ar: translation[1], image: `/vocabulary/${id}.webp`, tint: tints[index % tints.length] };
  }),
}));
