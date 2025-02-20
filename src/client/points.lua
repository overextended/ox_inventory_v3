---@class Drop : Array, CPoint
local drops = lib.array:new()

---@param drop Drop
local function nearbyDrop(drop)
    ---@diagnostic disable
    DrawMarker(2, drop.coords.x, drop.coords.y, drop.coords.z, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3, 0.2, 0.15, 150, 30,
        30, 222, false, false, 0, true, false, false, false)
    ---@diagnostic enable
end

RegisterNetEvent('ox_inventory:createDrop', function(data)
    data.nearby = nearbyDrop
    data.distance = 40

    drops:push(lib.points.new(data))
end)

RegisterNetEvent('ox_inventory:removeDrop', function(dropId)
    local index = drops:findIndex(function(drop) return drop.inventoryId == dropId and drop end)

    if not index then return end

    local drop = drops[index] ---@type CPoint
    drop:remove()
    table.remove(drops, index)
end)

exports('getNearbyInventories', function()
    local points = lib.points.getNearbyPoints()

    return lib.array.map(points,
        ---@param point CPoint
        function(point) return point.currentDistance < 8 and point.inventoryId end)
end)
