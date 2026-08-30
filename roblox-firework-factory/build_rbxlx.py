from pathlib import Path
from xml.sax.saxutils import escape

root = Path(__file__).parent
server = (root / 'src/ServerScriptService/FireworkFactory.server.lua').read_text()
client = (root / 'src/StarterPlayer/StarterPlayerScripts/FireworkFactory.client.lua').read_text()

def item(cls, name, source=None, children=''):
    props = f'<Properties><string name="Name">{escape(name)}</string>'
    if source is not None:
        props += f'<ProtectedString name="Source"><![CDATA[{source}]]></ProtectedString>'
    props += '</Properties>'
    return f'<Item class="{cls}">{props}{children}</Item>'

services = ''
services += item('ReplicatedStorage', 'ReplicatedStorage')
services += item('ServerScriptService', 'ServerScriptService', children=item('Script', 'FireworkFactory.server', server))
services += item('StarterPlayer', 'StarterPlayer', children=item('StarterPlayerScripts', 'StarterPlayerScripts', children=item('LocalScript', 'FireworkFactory.client', client)))
services += item('Workspace', 'Workspace')
services += item('Players', 'Players')
services += item('Lighting', 'Lighting')
xml = '<?xml version="1.0" encoding="utf-8"?>\n<roblox version="4" xmlns:xmime="http://www.w3.org/2005/05/xmlmime">\n' + services + '\n</roblox>\n'
(root / 'FireworkFactoryTycoon.rbxlx').write_text(xml)
print('created', root / 'FireworkFactoryTycoon.rbxlx')
