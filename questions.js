const _questions = [
    'What type of "background":https://e621.net/wiki?title=background ?',
    'Who are the {artist(s)}?',
    'Who are the {character(s)}?',
    '{How many} character(s) are there?',
    'What are the character(s) [[clothing]]?',
    'What are the character(s) "sex(s)":https://e621.net/wiki/show/howto:tag_genders ?'
].map(e=>({
  text: e.substring(e.indexOf('|')+1)
    .replace(/\[\[(.+?)?\]\]/g, '<a class="u" href="https://e621.net/wiki/show/$1">$1</a>')
    .replace(/\{(.+?)\}/, '<span class="h">$1</span>')
    .replace(/\"(.+?)?\"\:(.+?)?\s/g, '<a href="$2" class="u">$1</a>'),
  req: e.substring(0, e.indexOf('|'))
}));