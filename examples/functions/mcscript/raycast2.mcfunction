#######
# Compiled from .//functions/raycasting.mcscript
# to functions/mcscript/raycast2.mcfunction
#
# Generated by Minecraft Script for 1.13
######
particle flame ~ ~ ~
scoreboard players add raycast2 mcscript_raycast 1
execute positioned ^ ^ ^1 unless block ~ ~ ~ air run tag @s add mcscriptStop
execute positioned ^ ^ ^1 if entity @s[tag=!mcscriptStop] if block ~ ~ ~ air if score raycast2 mcscript_raycast matches ..10 run function :mcscript/raycast2
execute if score raycast2 mcscript_raycast matches ..10 if entity @s[tag=mcscriptStop] positioned ^ ^ ^1 run setblock ~ ~ ~ stone
tag @s[tag=mcscriptStop] remove mcscriptStop
