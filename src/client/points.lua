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

exports('getClosestInventory', function(type, distance)
    distance = distance or 1

    if not type then
        local point = lib.points.getClosestPoint()

        if point and point.currentDistance < distance then
            return point
        end
    end

    ---@type CPoint
    local point = lib.array.reduce(lib.points.getNearbyPoints(), function(acc, point)
        if point.currentDistance < acc.distance then
            return point
        end

        return acc
    end)

    return point and point.currentDistance < distance and point.inventoryId
end)

exports('getNearbyInventories', function()
    local points = lib.points.getNearbyPoints()

    return lib.array.map(points,
        ---@param point CPoint
        function(point) return point.currentDistance < 1 and point.inventoryId end)
end)
