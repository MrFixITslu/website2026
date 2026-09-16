export function certificateImage(name:string,course:string,id:string,issuedAt:string): HTMLCanvasElement {
 const canvas=document.createElement('canvas');canvas.width=2000;canvas.height=1414;const c=canvas.getContext('2d');if(!c)throw Error('Your browser cannot create a certificate image.');
 c.fillStyle='#f8fafc';c.fillRect(0,0,2000,1414);c.strokeStyle='#0f766e';c.lineWidth=12;c.strokeRect(55,55,1890,1304);c.lineWidth=2;c.strokeRect(80,80,1840,1254);c.textAlign='center';
 const line=(text:string,y:number,size:number,color='#0f172a')=>{c.fillStyle=color;c.font=`${size}px Georgia, serif`;c.fillText(text,1000,y,1740);};
 line('VISION79 DIGITAL',205,55,'#0f766e');line('CERTIFICATE OF COMPLETION',340,60);line('This certifies that',440,32);line(name,560,68);line('has successfully completed',660,32);line(course,775,55);line('and passed the course assessment.',855,32);line('Issued '+new Date(issuedAt).toLocaleDateString(),1010,32);line(id,1125,28);line(location.origin+'/api/certificates/'+id,1190,24,'#0f766e');line('Verify this record using the link above.',1250,24);
 return canvas;
}
export function printCertificate(canvas:HTMLCanvasElement){
 const frame=document.createElement('iframe');frame.style.position='fixed';frame.style.width='1px';frame.style.height='1px';frame.style.border='0';document.body.appendChild(frame);
 const doc=frame.contentDocument;if(!doc){frame.remove();throw Error('Printing is unavailable. Download the PNG instead.');}
 const style=doc.createElement('style');style.textContent='@page{size:A4 landscape;margin:0}body{margin:0}img{width:100%;height:auto}';doc.head.appendChild(style);const img=doc.createElement('img');img.alt='Course completion certificate';img.onload=()=>{frame.contentWindow?.focus();frame.contentWindow?.print();};img.src=canvas.toDataURL('image/png');doc.body.appendChild(img);setTimeout(()=>frame.remove(),60000);
}
