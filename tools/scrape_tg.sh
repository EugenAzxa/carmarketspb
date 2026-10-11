#!/bin/sh
# Pull the public preview of a Telegram channel (t.me/s/<channel>) N pages back.
# usage: tools/scrape_tg.sh lexautospb13 25 /tmp/tg   ->  then: python3 tools/parse_tg.py /tmp/tg tools/posts.json
CH=$1; PAGES=${2:-20}; OUT=${3:-/tmp/tg}
mkdir -p "$OUT"
curl -sL -A "Mozilla/5.0" "https://t.me/s/$CH" -o "$OUT/p_first.html"
B=$(python3 -c "import re,sys;ids=[int(x) for x in re.findall(r'data-post=\"$CH/(\d+)\"',open(sys.argv[1]).read())];print(min(ids))" "$OUT/p_first.html")
i=0
while [ $i -lt "$PAGES" ] && [ -n "$B" ]; do
  curl -sL -A "Mozilla/5.0" "https://t.me/s/$CH?before=$B" -o "$OUT/p_$B.html"
  B=$(python3 -c "import re,sys;ids=[int(x) for x in re.findall(r'data-post=\"$CH/(\d+)\"',open(sys.argv[1]).read())];print(min(ids) if ids else '')" "$OUT/p_$B.html")
  i=$((i+1))
done
