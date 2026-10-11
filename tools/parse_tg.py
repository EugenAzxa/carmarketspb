import re,html,glob,json,sys
out={}
for f in sorted(glob.glob(sys.argv[1]+'/*.html')):
    s=open(f,encoding='utf-8').read()
    for blk in re.split(r'(?=<div class="tgme_widget_message_wrap)',s)[1:]:
        pid=re.search(r'data-post="lexautospb13/(\d+)"',blk)
        if not pid: continue
        pid=int(pid.group(1))
        txt=re.search(r'<div class="tgme_widget_message_text[^"]*"[^>]*>(.*?)</div>',blk,re.S)
        t=''
        if txt:
            t=re.sub(r'<br\s*/?>','\n',txt.group(1)); t=html.unescape(re.sub(r'<[^>]+>','',t))
        photos=re.findall(r"background-image:url\('([^']+)'\)",blk)
        photos=[p for p in photos if 'cdn' in p or 'telesco' in p]
        views=re.search(r'tgme_widget_message_views">([^<]+)',blk)
        date=re.search(r'datetime="([^"]+)"',blk)
        out[pid]={'id':pid,'text':t,'photos':photos,'views':views and views.group(1),'date':date and date.group(1)}
json.dump([out[k] for k in sorted(out)],open(sys.argv[2],'w'),ensure_ascii=False,indent=1)
print(len(out))
