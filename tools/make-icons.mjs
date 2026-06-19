import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

function crc32(buf){
  let c; const t=[];
  for(let n=0;n<256;n++){c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}
  let crc=0xffffffff;
  for(let i=0;i<buf.length;i++)crc=t[(crc^buf[i])&0xff]^(crc>>>8);
  return (crc^0xffffffff)>>>0;
}
function chunk(type,data){
  const len=Buffer.alloc(4); len.writeUInt32BE(data.length,0);
  const body=Buffer.concat([Buffer.from(type,'ascii'),data]);
  const crc=Buffer.alloc(4); crc.writeUInt32BE(crc32(body),0);
  return Buffer.concat([len,body,crc]);
}
function makePng(size,rgb){
  const sig=Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(size,0); ihdr.writeUInt32BE(size,4);
  ihdr[8]=8; ihdr[9]=2;
  const row=Buffer.alloc(1+size*3);
  for(let x=0;x<size;x++){row[1+x*3]=rgb[0];row[1+x*3+1]=rgb[1];row[1+x*3+2]=rgb[2];}
  const raw=Buffer.concat(Array.from({length:size},()=>Buffer.from(row)));
  const idat=deflateSync(raw);
  return Buffer.concat([sig,chunk('IHDR',ihdr),chunk('IDAT',idat),chunk('IEND',Buffer.alloc(0))]);
}
mkdirSync('assets',{recursive:true});
writeFileSync('assets/icon-192.png',makePng(192,[11,16,38]));
writeFileSync('assets/icon-512.png',makePng(512,[11,16,38]));
console.log('icons written');
