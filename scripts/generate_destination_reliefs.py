import numpy as np
from PIL import Image
import os

OUT_DIR = '/home/localhost/projects/colab/NASA/pathfinder/public/mars-data'
DIST_DIR = '/home/localhost/projects/colab/NASA/pathfinder/dist/mars-data'
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(DIST_DIR, exist_ok=True)

def apply_shading(z, cell_x_m, cell_y_m, sun_az_deg=315.0, sun_alt_deg=38.0):
    dz_dy, dz_dx = np.gradient(z, cell_y_m, cell_x_m)
    p = dz_dx
    q = -dz_dy
    sun_az = np.radians(sun_az_deg)
    sun_alt = np.radians(sun_alt_deg)
    cos_zenith = np.sin(sun_alt)
    sin_zenith = np.cos(sun_alt)
    denom = np.sqrt(1.0 + p**2 + q**2)
    illum = (cos_zenith - sin_zenith * (p * np.sin(sun_az) + q * np.cos(sun_az))) / denom
    illum = np.clip(illum, 0.0, 1.0)
    illum_curved = np.power(illum, 0.88)
    return illum_curved

def colorize(illum, z, z_min, z_max):
    t = (z - z_min) / (z_max - z_min + 1e-5)
    t = np.clip(t, 0.0, 1.0)
    # Deep ochre / hematite red Martian palette
    r = 210.0 * illum + 32.0 * t
    g = 115.0 * illum + 22.0 * t
    b = 70.0 * illum + 15.0 * t
    rgb = np.stack([np.clip(r, 0, 255), np.clip(g, 0, 255), np.clip(b, 0, 255)], axis=-1).astype(np.uint8)
    return Image.fromarray(rgb)

def save_image(im, filename):
    p1 = os.path.join(OUT_DIR, filename)
    p2 = os.path.join(DIST_DIR, filename)
    im.save(p1, 'PNG')
    im.save(p2, 'PNG')
    print(f'✓ {filename} saved to public/ and dist/')

def generate_gale():
    print('Generating Gale Crater & Mount Sharp relief...')
    width, height = 2048, 2048
    x = np.linspace(-35.0, 35.0, width)
    y = np.linspace(35.0, -35.0, height)
    km_x, km_y = np.meshgrid(x, y)
    r_km = np.sqrt(km_x**2 + km_y**2)

    # Gale Crater basin (-4500m floor, rim at -1200m at r=77km)
    z = -4500.0 + 3300.0 * (r_km / 75.0)**2.2

    # Aeolis Mons (Mount Sharp): central mound rising 5.5 km above floor to +1000m
    sharp_mask = np.exp(-((km_x / 14.0)**2 + ((km_y + 4.0) / 12.0)**2))
    sharp_elevation = 5500.0 * sharp_mask
    terraces = 90.0 * np.sin(sharp_elevation / 140.0) * sharp_mask
    z += sharp_elevation + terraces

    # Bagnold active dune fields
    dune_mask = np.exp(-(((km_x + 1.0) / 8.0)**2 + ((km_y - 3.5) / 2.5)**2))
    dunes = 25.0 * np.sin(km_x * 4.0) * dune_mask
    z += dunes

    # Secondary impact craters
    craters = [
        (-15.0, 12.0, 2.5, 380.0),
        (18.0, -8.0, 3.2, 490.0),
        (-8.0, -18.0, 2.1, 310.0),
        (12.0, 15.0, 2.8, 420.0),
        (-2.0, 8.0, 1.4, 210.0),
    ]
    for cx, cy, cr, cd in craters:
        d = np.sqrt((km_x - cx)**2 + (km_y - cy)**2)
        inner = d < cr
        bowl = -cd * (1.0 - (d / cr)**2)
        rim = (cd * 0.3) * np.exp(-((d - cr) / (cr * 0.4))**2)
        z += np.where(inner, bowl, rim)

    illum = apply_shading(z, 70000.0 / width, 70000.0 / height)
    im = colorize(illum, z, -4500.0, 1200.0)
    save_image(im, 'gale_shaded_relief.png')

def generate_olympus():
    print('Generating Olympus Mons Caldera relief...')
    width, height = 2048, 2048
    x = np.linspace(-60.0, 60.0, width)
    y = np.linspace(60.0, -60.0, height)
    km_x, km_y = np.meshgrid(x, y)
    r_km = np.sqrt(km_x**2 + km_y**2)

    # Olympus Mons summit shield flank rising to 21,900 m
    z = 21900.0 - (r_km * 160.0)

    # Multi-ring Summit Caldera complex (80 km wide)
    caldera_rings = [
        (0.0, 0.0, 18.0, 1800.0),
        (-10.0, 5.0, 14.0, 2400.0),
        (8.0, -6.0, 12.0, 1400.0),
        (-4.0, -12.0, 10.0, 1100.0),
    ]
    for cx, cy, cr, cd in caldera_rings:
        d = np.sqrt((km_x - cx)**2 + (km_y - cy)**2)
        mask = d < cr
        wall_drop = cd * np.tanh((cr - d) * 1.2)
        z -= np.where(mask, wall_drop, 0.0)

    theta = np.arctan2(km_y, km_x)
    channels = 45.0 * np.sin(theta * 16.0) * (r_km > 22.0)
    z += channels

    illum = apply_shading(z, 120000.0 / width, 120000.0 / height)
    im = colorize(illum, z, 15000.0, 22000.0)
    save_image(im, 'olympus_shaded_relief.png')

def generate_valles():
    print('Generating Valles Marineris Canyon relief...')
    width, height = 2048, 2048
    x = np.linspace(-80.0, 80.0, width)
    y = np.linspace(50.0, -50.0, height)
    km_x, km_y = np.meshgrid(x, y)

    z = np.full_like(km_x, 2000.0)
    canyon_half_width = 30.0 + 8.0 * np.sin(km_x / 15.0)
    in_canyon = np.abs(km_y) < canyon_half_width
    wall_dist = canyon_half_width - np.abs(km_y)

    canyon_depth = 7000.0 * np.tanh(wall_dist / 6.0)
    z -= np.where(in_canyon, canyon_depth, 0.0)

    spurs = 350.0 * np.sin(km_x * 0.8) * np.exp(-((wall_dist - 4.0) / 3.0)**2) * in_canyon
    z += spurs

    illum = apply_shading(z, 160000.0 / width, 100000.0 / height)
    im = colorize(illum, z, -5000.0, 2200.0)
    save_image(im, 'valles_shaded_relief.png')

def generate_meridiani():
    print('Generating Meridiani Planum & Endeavour Crater relief...')
    width, height = 2048, 2048
    x = np.linspace(-35.0, 35.0, width)
    y = np.linspace(35.0, -35.0, height)
    km_x, km_y = np.meshgrid(x, y)

    # Meridiani Planum flat sulfate sedimentary plain (-1420m)
    z = np.full_like(km_x, -1420.0)

    # Sulfate ripple fields & hematite bedforms
    ripples = 12.0 * np.sin(km_x * 2.8 + km_y * 1.2)
    z += ripples

    # Endeavour Crater (22 km diameter, centered at x=14, y=-11)
    end_cx, end_cy, end_r, end_depth = 14.0, -11.0, 11.0, 320.0
    d_end = np.sqrt((km_x - end_cx)**2 + (km_y - end_cy)**2)
    in_end = d_end < end_r
    end_floor = -1420.0 - end_depth * (1.0 - (d_end / end_r)**1.8)
    end_rim = -1420.0 + 180.0 * np.exp(-((d_end - end_r) / 1.8)**2)
    z = np.where(in_end, end_floor, np.maximum(z, end_rim))

    # Victoria Crater (800m diameter, at x=-2, y=3)
    vic_cx, vic_cy, vic_r, vic_depth = -2.0, 3.0, 0.45, 75.0
    d_vic = np.sqrt((km_x - vic_cx)**2 + (km_y - vic_cy)**2)
    in_vic = d_vic < vic_r
    vic_scallops = 6.0 * np.cos(np.arctan2(km_y - vic_cy, km_x - vic_cx) * 16.0)
    vic_floor = -1420.0 - vic_depth * (1.0 - (d_vic / vic_r)**2)
    vic_rim = -1420.0 + (35.0 + vic_scallops) * np.exp(-((d_vic - vic_r) / 0.15)**2)
    z = np.where(in_vic, vic_floor, np.maximum(z, vic_rim))

    # Endurance Crater (130m diameter, at x=-4.2, y=9.1)
    endur_cx, endur_cy, endur_r, endur_depth = -4.2, 9.1, 0.15, 22.0
    d_endur = np.sqrt((km_x - endur_cx)**2 + (km_y - endur_cy)**2)
    in_endur = d_endur < endur_r
    endur_floor = -1420.0 - endur_depth * (1.0 - (d_endur / endur_r)**2)
    endur_rim = -1420.0 + 8.0 * np.exp(-((d_endur - endur_r) / 0.05)**2)
    z = np.where(in_endur, endur_floor, np.maximum(z, endur_rim))

    # Secondary craters across Meridiani
    craters = [
        (-18.0, 16.0, 1.4, 160.0),
        (22.0, 18.0, 2.1, 240.0),
        (-22.0, -18.0, 1.8, 190.0),
        (5.0, 22.0, 1.2, 130.0),
    ]
    for cx, cy, cr, cd in craters:
        d = np.sqrt((km_x - cx)**2 + (km_y - cy)**2)
        inner = d < cr
        bowl = -1420.0 - cd * (1.0 - (d / cr)**2)
        rim = -1420.0 + (cd * 0.28) * np.exp(-((d - cr) / (cr * 0.35))**2)
        z = np.where(inner, bowl, np.maximum(z, rim))

    illum = apply_shading(z, 70000.0 / width, 70000.0 / height)
    im = colorize(illum, z, -1800.0, -1100.0)
    save_image(im, 'meridiani_shaded_relief.png')

def generate_gusev():
    print('Generating Gusev Crater & Columbia Hills relief...')
    width, height = 2048, 2048
    x = np.linspace(-35.0, 35.0, width)
    y = np.linspace(35.0, -35.0, height)
    km_x, km_y = np.meshgrid(x, y)

    # Gusev basaltic crater floor (-1920m)
    z = np.full_like(km_x, -1920.0)

    # Columbia Hills massif (Husband Hill +110m, McCool Hill, Home Plate silica plateau)
    hills_mask = np.exp(-(((km_x - 3.5) / 5.0)**2 + ((km_y + 4.5) / 3.5)**2))
    husband_hill = 115.0 * hills_mask
    home_plate = 35.0 * np.exp(-(((km_x - 4.5) / 1.2)**2 + ((km_y + 6.0) / 1.0)**2))
    z += husband_hill + home_plate

    # Bonneville Crater (200m diameter at x=0.5, y=-1.5)
    bon_cx, bon_cy, bon_r, bon_depth = 0.5, -1.5, 0.22, 28.0
    d_bon = np.sqrt((km_x - bon_cx)**2 + (km_y - bon_cy)**2)
    in_bon = d_bon < bon_r
    bon_floor = -1920.0 - bon_depth * (1.0 - (d_bon / bon_r)**2)
    bon_rim = -1920.0 + 8.0 * np.exp(-((d_bon - bon_r) / 0.08)**2)
    z = np.where(in_bon, bon_floor, np.maximum(z, bon_rim))

    # Gusev regional rim rampart at SW
    r_sw = np.sqrt((km_x + 25.0)**2 + (km_y + 25.0)**2)
    rim_elev = 800.0 * np.exp(-((r_sw - 30.0) / 8.0)**2)
    z += rim_elev

    illum = apply_shading(z, 70000.0 / width, 70000.0 / height)
    im = colorize(illum, z, -2000.0, -1700.0)
    save_image(im, 'gusev_shaded_relief.png')

if __name__ == '__main__':
    generate_gale()
    generate_olympus()
    generate_valles()
    generate_meridiani()
    generate_gusev()
    print('ALL DESTINATION RELIEFS GENERATED SUCCESSFULLY!')
