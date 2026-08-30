-- Firework Factory Tycoon | Server logic
-- Alles ist bewusst fiktional: Komponenten besitzen Spielwerte, keine realen Herstellungsangaben.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService = game:GetService("DataStoreService")
local Debris = game:GetService("Debris")
local SaveStore = DataStoreService:GetDataStore("FireworkFactoryTycoon_v2")

local remotes = ReplicatedStorage:FindFirstChild("FireworkRemotes") or Instance.new("Folder")
remotes.Name = "FireworkRemotes"
remotes.Parent = ReplicatedStorage

local action = remotes:FindFirstChild("Action") or Instance.new("RemoteEvent")
action.Name = "Action"
action.Parent = remotes

local stateEvent = remotes:FindFirstChild("State") or Instance.new("RemoteEvent")
stateEvent.Name = "State"
stateEvent.Parent = remotes

local catalog = {
    ProductTypes = {
        ["Rakete"] = {base=80, risk=8, capacity=1},
        ["Single Shot"] = {base=55, risk=3, capacity=1},
        ["Vulkan"] = {base=100, risk=5, capacity=2},
        ["Batterie"] = {base=180, risk=10, capacity=4},
        ["Böller"] = {base=35, risk=14, capacity=1},
    },
    Colors = {Rot=4, Blau=5, Grün=4, Gold=8, Violett=7, Silber=6},
    Sparks = {Glitzer=5, Kometen=7, Crackle=9, Weide=8, Ring=10},
    Patterns = {Stern=5, Palme=8, Herz=12, Spiral=10, Konfetti=7},
}

local playerData = {}
local plots = {}

local function defaultRecipe()
    return {product="Rakete", powder=2, colors={"Rot"}, spark="Glitzer", pattern="Stern", delay=1, packaging="Standard"}
end

local function serialize(data)
    return {coins=data.coins, level=data.level, xp=data.xp, capacity=data.capacity, recipe=data.recipe, inventory=data.inventory, lastScore=data.lastScore, lastSale=data.lastSale}
end

local function push(player, message)
    local data = playerData[player]
    if data then
        stateEvent:FireClient(player, serialize(data), message or "")
    end
end

local function createVirtualBurst(position, recipe, score)
    local colors = {Color3.fromRGB(255,70,70), Color3.fromRGB(70,140,255), Color3.fromRGB(70,255,120), Color3.fromRGB(255,210,65), Color3.fromRGB(200,90,255)}
    local attachment = Instance.new("Attachment"); attachment.WorldPosition = position + Vector3.new(0, 5, 0); attachment.Parent = workspace.Terrain
    local emitter = Instance.new("ParticleEmitter"); emitter.Texture = "rbxasset://textures/particles/sparkles_main.dds"; emitter.Color = ColorSequence.new(colors[math.random(1,#colors)]); emitter.LightEmission = 1; emitter.Rate = 0; emitter.Lifetime = NumberRange.new(1.2, 2.2); emitter.Speed = NumberRange.new(24 + score/4, 42 + score/3); emitter.SpreadAngle = Vector2.new(360,360); emitter.Drag = 2; emitter.Size = NumberSequence.new({NumberSequenceKeypoint.new(0,0.45), NumberSequenceKeypoint.new(1,0)}); emitter:Emit(90 + score); emitter.Parent = attachment
    Debris:AddItem(attachment, 4)
end

local function createCustomer(plot, index)
    local npc = Instance.new("Model"); npc.Name = "Customer_" .. index; npc.Parent = plot.model
    local body = Instance.new("Part"); body.Name = "Body"; body.Size = Vector3.new(2,3,1.2); body.Position = plot.origin + Vector3.new(-18 + index*5, 1.5, -17); body.Anchored = true; body.Color = Color3.fromHSV(index/5, .65, .9); body.Parent = npc
    local head = Instance.new("Part"); head.Name = "Head"; head.Shape = Enum.PartType.Ball; head.Size = Vector3.new(1.6,1.6,1.6); head.Position = body.Position + Vector3.new(0,2.2,0); head.Anchored = true; head.Color = Color3.fromRGB(255,200,160); head.Parent = npc
    local billboard = Instance.new("BillboardGui"); billboard.Size = UDim2.fromOffset(140,30); billboard.StudsOffset = Vector3.new(0,3,0); billboard.AlwaysOnTop = true; billboard.Parent = head
    local text = Instance.new("TextLabel"); text.Size = UDim2.fromScale(1,1); text.BackgroundTransparency = 1; text.Text = index == 1 and "Kunde" or "Fan"; text.TextColor3 = Color3.new(1,1,1); text.TextStrokeTransparency = .2; text.TextScaled = true; text.Parent = billboard
end

local function createPlot(player)
    local index = #plots + 1
    local model = Instance.new("Model")
    model.Name = "Factory_" .. player.UserId
    model:SetAttribute("OwnerUserId", player.UserId)
    model.Parent = workspace
    local origin = Vector3.new((index - 1) * 70, 0, 0)
    local floor = Instance.new("Part")
    floor.Name = "FactoryFloor"
    floor.Size = Vector3.new(58, 1, 48)
    floor.Position = origin + Vector3.new(0, -0.5, 0)
    floor.Anchored = true
    floor.Material = Enum.Material.Concrete
    floor.Color = Color3.fromRGB(70, 76, 88)
    floor.Parent = model
    local sign = Instance.new("Part")
    sign.Name = "FactorySign"
    sign.Size = Vector3.new(16, 7, 0.5)
    sign.Position = origin + Vector3.new(0, 5, -23)
    sign.Anchored = true
    sign.Color = Color3.fromRGB(255, 155, 45)
    sign.Parent = model
    local gui = Instance.new("SurfaceGui")
    gui.Face = Enum.NormalId.Front
    gui.Parent = sign
    local label = Instance.new("TextLabel")
    label.Size = UDim2.fromScale(1, 1)
    label.BackgroundTransparency = 1
    label.TextScaled = true
    label.Font = Enum.Font.GothamBold
    label.TextColor3 = Color3.new(1,1,1)
    label.Text = player.DisplayName .. "'s Factory"
    label.Parent = gui
    local function station(name, pos, size, color, text)
        local part = Instance.new("Part"); part.Name=name; part.Size=size; part.Position=origin+pos; part.Anchored=true; part.Material=Enum.Material.Metal; part.Color=color; part.Parent=model
        local board=Instance.new("BillboardGui"); board.Size=UDim2.fromOffset(160,35); board.StudsOffset=Vector3.new(0, size.Y/2+1, 0); board.AlwaysOnTop=true; board.Parent=part
        local t=Instance.new("TextLabel"); t.Size=UDim2.fromScale(1,1); t.BackgroundColor3=Color3.fromRGB(20,24,34); t.BackgroundTransparency=.15; t.Text=text; t.TextColor3=Color3.new(1,1,1); t.TextScaled=true; t.Font=Enum.Font.GothamBold; t.Parent=board
        local tc=Instance.new("UICorner"); tc.CornerRadius=UDim.new(0,8); tc.Parent=t
    end
    station("Workshop", Vector3.new(-14,2,-5), Vector3.new(10,4,7), Color3.fromRGB(55,105,155), "WERKBANK")
    station("Storage", Vector3.new(15,2,-5), Vector3.new(10,4,7), Color3.fromRGB(90,120,80), "LAGER")
    station("TestArena", Vector3.new(0,1,9), Vector3.new(20,2,10), Color3.fromRGB(110,75,130), "TESTSHOW")
    local spawn = Instance.new("SpawnLocation")
    spawn.Name = "FactorySpawn"
    spawn.Size = Vector3.new(5, 1, 5)
    spawn.Position = origin + Vector3.new(0, 1, 15)
    spawn.Anchored = true
    spawn.Neutral = false
    spawn.BrickColor = BrickColor.new("Bright green")
    spawn.Parent = model
    plots[player] = {model=model, origin=origin}
    for i=1,3 do createCustomer(plots[player], i) end
end

local function removePlot(player)
    if plots[player] then plots[player].model:Destroy(); plots[player] = nil end
end

local function validateRecipe(recipe, data)
    if type(recipe) ~= "table" or not catalog.ProductTypes[recipe.product] then return false, "Produkttyp fehlt." end
    local p = tonumber(recipe.powder) or 0
    if p < 1 or p > data.capacity then return false, "Diese virtuelle Pulvermenge ist noch nicht freigeschaltet." end
    if type(recipe.colors) ~= "table" or #recipe.colors < 1 or #recipe.colors > 3 then return false, "Wähle 1 bis 3 Farben." end
    for _, c in ipairs(recipe.colors) do if not catalog.Colors[c] then return false, "Ungültige Farbe." end end
    if not catalog.Sparks[recipe.spark] or not catalog.Patterns[recipe.pattern] then return false, "Effekt nicht freigeschaltet." end
    return true
end

local function scoreRecipe(recipe)
    local product = catalog.ProductTypes[recipe.product]
    local score = 35 + math.min(25, (#recipe.colors * 6)) + catalog.Sparks[recipe.spark] + catalog.Patterns[recipe.pattern]
    score += math.min(18, (tonumber(recipe.powder) or 1) * 4)
    score -= product.risk
    score += math.random(-5, 8)
    return math.clamp(score, 10, 100)
end

local function addXP(player, amount)
    local data = playerData[player]
    data.xp += amount
    while data.xp >= data.level * 100 do data.xp -= data.level * 100; data.level += 1; data.capacity = math.min(10, data.capacity + 1) end
end

Players.PlayerAdded:Connect(function(player)
    local loaded = nil
    pcall(function() loaded = SaveStore:GetAsync("player_" .. player.UserId) end)
    playerData[player] = loaded or {coins=500, level=1, xp=0, capacity=2, recipe=defaultRecipe(), inventory={}, lastScore=0, lastSale=0}
    local leaderstats = Instance.new("Folder"); leaderstats.Name = "leaderstats"; leaderstats.Parent = player
    local coins = Instance.new("IntValue"); coins.Name = "Coins"; coins.Value = playerData[player].coins; coins.Parent = leaderstats
    createPlot(player)
    task.wait(1)
    push(player, "Willkommen in deiner Feuerwerk-Fabrik!")
end)

local function savePlayer(player)
    local data = playerData[player]
    if data then pcall(function() SaveStore:SetAsync("player_" .. player.UserId, data) end) end
end
Players.PlayerRemoving:Connect(function(player) savePlayer(player); playerData[player] = nil; removePlot(player) end)
game:BindToClose(function() for player in pairs(playerData) do savePlayer(player) end end)

action.OnServerEvent:Connect(function(player, command, payload)
    local data = playerData[player]; if not data then return end
    if command == "SetRecipe" then
        local ok, err = validateRecipe(payload, data)
        if ok then data.recipe = payload; push(player, "Rezept gespeichert.") else push(player, err) end
    elseif command == "Test" then
        local ok, err = validateRecipe(data.recipe, data)
        if not ok then push(player, err); return end
        local score = scoreRecipe(data.recipe); data.lastScore = score; addXP(player, 20)
        if plots[player] then createVirtualBurst(plots[player].origin + Vector3.new(0, 0, -4), data.recipe, score) end
        push(player, "Testshow abgeschlossen: " .. score .. "/100 Punkte. Die virtuelle Show ist im Testbereich sichtbar!")
    elseif command == "Produce" then
        local ok, err = validateRecipe(data.recipe, data)
        if not ok then push(player, err); return end
        table.insert(data.inventory, {recipe=data.recipe, score=data.lastScore > 0 and data.lastScore or scoreRecipe(data.recipe)})
        addXP(player, 10); push(player, "Produziert! Lagerbestand: " .. #data.inventory)
    elseif command == "Sell" then
        if #data.inventory == 0 then push(player, "Dein Lager ist leer."); return end
        local item = table.remove(data.inventory, 1); local reward = math.floor(catalog.ProductTypes[item.recipe.product].base * (0.7 + item.score / 100))
        data.coins += reward; data.lastSale = reward; player.leaderstats.Coins.Value = data.coins; addXP(player, 15)
        push(player, "Verkauft für " .. reward .. " Coins.")
    elseif command == "Quest" then
        local reward = 100 + data.level * 25
        data.coins += reward; player.leaderstats.Coins.Value = data.coins; addXP(player, 25)
        push(player, "Auftrag erledigt: Kundenauftrag für " .. reward .. " Coins abgeschlossen.")
    elseif command == "Upgrade" then
        local price = data.level * 350
        if data.coins < price then push(player, "Du brauchst " .. price .. " Coins für das nächste Upgrade."); return end
        data.coins -= price; data.capacity = math.min(10, data.capacity + 1); player.leaderstats.Coins.Value = data.coins; push(player, "Werkbank verbessert: mehr virtuelle Komponenten möglich.")
    end
end)
