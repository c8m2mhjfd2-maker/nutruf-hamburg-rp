-- Firework Factory Tycoon | Client workshop UI
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local player = Players.LocalPlayer
local remotes = ReplicatedStorage:WaitForChild("FireworkRemotes")
local action = remotes:WaitForChild("Action")
local stateEvent = remotes:WaitForChild("State")

local products = {"Rakete", "Single Shot", "Vulkan", "Batterie", "Böller"}
local colors = {"Rot", "Blau", "Grün", "Gold", "Violett", "Silber"}
local sparks = {"Glitzer", "Kometen", "Crackle", "Weide", "Ring"}
local patterns = {"Stern", "Palme", "Herz", "Spiral", "Konfetti"}
local recipe = {product="Rakete", powder=2, colors={"Rot"}, spark="Glitzer", pattern="Stern", delay=1, packaging="Standard"}
local selectedColors = {Rot=true}

local gui = Instance.new("ScreenGui"); gui.Name = "FireworkFactoryUI"; gui.ResetOnSpawn = false; gui.Parent = player:WaitForChild("PlayerGui")
local panel = Instance.new("Frame"); panel.Size = UDim2.fromOffset(430, 610); panel.Position = UDim2.new(0, 22, 0.5, -305); panel.BackgroundColor3 = Color3.fromRGB(24, 27, 38); panel.BorderSizePixel = 0; panel.Parent = gui
local corner = Instance.new("UICorner"); corner.CornerRadius = UDim.new(0, 14); corner.Parent = panel
local title = Instance.new("TextLabel"); title.Size = UDim2.new(1, -30, 0, 42); title.Position = UDim2.fromOffset(15, 12); title.BackgroundTransparency = 1; title.Text = "FEUERWERK-WERKBANK"; title.TextColor3 = Color3.fromRGB(255, 183, 66); title.Font = Enum.Font.GothamBold; title.TextSize = 22; title.Parent = panel
local status = Instance.new("TextLabel"); status.Size = UDim2.new(1, -30, 0, 36); status.Position = UDim2.fromOffset(15, 52); status.BackgroundTransparency = 1; status.TextWrapped = true; status.TextColor3 = Color3.fromRGB(205, 210, 225); status.Font = Enum.Font.Gotham; status.TextSize = 14; status.Text = "Stelle dein virtuelles Feuerwerk zusammen."; status.Parent = panel

local y = 96
local function label(text)
    local l = Instance.new("TextLabel"); l.Size = UDim2.new(1, -30, 0, 22); l.Position = UDim2.fromOffset(15, y); l.BackgroundTransparency = 1; l.TextXAlignment = Enum.TextXAlignment.Left; l.Text = text; l.TextColor3 = Color3.fromRGB(240,240,245); l.Font = Enum.Font.GothamBold; l.TextSize = 14; l.Parent = panel; y += 24; return l
end
local function button(text, width)
    local b = Instance.new("TextButton"); b.Size = UDim2.fromOffset(width or 120, 32); b.Position = UDim2.fromOffset(15, y); b.BackgroundColor3 = Color3.fromRGB(51, 58, 78); b.TextColor3 = Color3.fromRGB(245,245,250); b.Font = Enum.Font.Gotham; b.TextSize = 13; b.Text = text; b.AutoButtonColor = true; b.Parent = panel; local c=Instance.new("UICorner"); c.CornerRadius=UDim.new(0,7); c.Parent=b; return b
end
local function rowButtons(items, callback)
    local x = 15; local startY = y
    for _, item in ipairs(items) do
        local b = button(item, math.max(72, math.min(130, #item*9+25))); b.Position = UDim2.fromOffset(x, startY); b.MouseButton1Click:Connect(function() callback(item,b) end); x += b.Size.X.Offset + 6
        if x > 390 then x=15; y += 38 end
    end
    y = math.max(y + 38, startY + 38)
end

label("1. Produkttyp")
rowButtons(products, function(item) recipe.product=item end)
label("2. Virtuelle Pulvermenge: 1–10")
local minus=button("−", 42); minus.Position=UDim2.fromOffset(15,y); local amount=Instance.new("TextLabel"); amount.Size=UDim2.fromOffset(80,32); amount.Position=UDim2.fromOffset(62,y); amount.BackgroundColor3=Color3.fromRGB(40,45,61); amount.TextColor3=Color3.new(1,1,1); amount.Font=Enum.Font.GothamBold; amount.TextSize=16; amount.Text=tostring(recipe.powder); amount.Parent=panel; local plus=button("+",42); plus.Position=UDim2.fromOffset(148,y); y+=44
minus.MouseButton1Click:Connect(function() recipe.powder=math.max(1,recipe.powder-1); amount.Text=tostring(recipe.powder) end)
plus.MouseButton1Click:Connect(function() recipe.powder=math.min(10,recipe.powder+1); amount.Text=tostring(recipe.powder) end)
label("3. Farben auswählen (mehrere möglich)")
rowButtons(colors, function(item,b) selectedColors[item]=not selectedColors[item]; b.BackgroundColor3=selectedColors[item] and Color3.fromRGB(223,123,42) or Color3.fromRGB(51,58,78) end)
label("4. Funken-Effekt")
rowButtons(sparks, function(item) recipe.spark=item end)
label("5. Muster")
rowButtons(patterns, function(item) recipe.pattern=item end)
label("6. Aktionen")
local save=button("Rezept speichern",125); save.Position=UDim2.fromOffset(15,y); local test=button("Testshow zünden",125); test.Position=UDim2.fromOffset(150,y); local produce=button("Produzieren",105); produce.Position=UDim2.fromOffset(285,y); y+=42
local sell=button("Erstes Lagerprodukt verkaufen",210); sell.Position=UDim2.fromOffset(15,y); local upgrade=button("Werkbank upgraden",150); upgrade.Position=UDim2.fromOffset(235,y)
local function collectColors() local result={} for _, c in ipairs(colors) do if selectedColors[c] then table.insert(result,c) end end return result end
save.MouseButton1Click:Connect(function() recipe.colors=collectColors(); action:FireServer("SetRecipe", recipe) end)
test.MouseButton1Click:Connect(function() action:FireServer("Test") end)
produce.MouseButton1Click:Connect(function() action:FireServer("Produce") end)
sell.MouseButton1Click:Connect(function() action:FireServer("Sell") end)
upgrade.MouseButton1Click:Connect(function() action:FireServer("Upgrade") end)
stateEvent.OnClientEvent:Connect(function(data, message) if data.recipe then recipe=data.recipe end; status.Text=message .. "   |   Level " .. data.level .. "   |   Coins " .. data.coins .. "   |   Lager " .. #data.inventory end)
