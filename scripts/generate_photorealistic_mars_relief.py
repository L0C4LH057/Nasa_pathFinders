import numpy as np
from PIL import Image

def generate_mars_relief():
    width, height = 2048, 2048
    lon_min, lon_max = 76.80, 78.10
    lat_min, lat_max = 18.00, 18.90

    x = np.linspace(lon_min, lon_max, width)
    y = np.linspace(lat_max, lat_min, height)
    lon_grid, lat_grid = np.meshgrid(x, y)

    # Coordinates in km relative to Jezero crater center (77.45°E, 18.45°N)
    cx, cy = 77.45, 18.45
    km_x = (lon_grid - cx) * 56.3
    km_y = (lat_grid - cy) * 59.3

    # 1. Base Jezero basin depression (45 km diameter)
    dist_center = np.sqrt(km_x**2 + km_y**2)
    z = -520.0 / (1.0 + np.exp(-(dist_center - 22.0) / 2.5))

    # 2. Prominent southern crater at (km_x = 2.0, km_y = -14.0, radius = 7.5 km)
    # This matches the prominent crater visible at the bottom of uploaded_media_1794671156323.jpg
    c1_dist = np.sqrt((km_x - 2.0)**2 + (km_y + 14.0)**2)
    c1_prof = -480.0 * np.exp(-(c1_dist / 6.2)**2) + 180.0 * np.exp(-((c1_dist - 7.5) / 1.6)**2)
    z += c1_prof

    # 3. Medium & prominent secondary craters matching the mockup
    craters = [
        (-8.0, 6.0, 3.8, 220.0, 85.0),    # NW delta crater
        (14.0, 12.0, 4.5, 260.0, 95.0),   # NE rim crater
        (-16.0, -4.0, 5.0, 300.0, 115.0), # SW delta rim crater
        (10.0, -8.0, 3.2, 190.0, 70.0),   # SE crater
        (-3.0, 10.0, 2.5, 150.0, 60.0),   # North crater
        (5.0, 2.0, 2.0, 120.0, 50.0),     # Central crater
        (-10.0, -12.0, 3.0, 170.0, 65.0), # South delta crater
        (18.0, -3.0, 3.5, 210.0, 80.0),   # East crater
        (-4.0, -2.0, 1.8, 95.0, 40.0),    # Delta front crater
        (0.0, 5.0, 1.5, 85.0, 35.0),      # North central crater
        (8.0, 7.0, 2.2, 130.0, 50.0),     # NE plain crater
        (3.0, -4.0, 1.6, 90.0, 35.0),     # SE plain crater
        (-6.0, 2.0, 1.4, 80.0, 30.0),     # Delta lobe crater
        (12.0, 4.0, 2.0, 110.0, 45.0),    # East-central crater
    ]

    for cx_i, cy_i, r_i, depth, rim in craters:
        d = np.sqrt((km_x - cx_i)**2 + (km_y - cy_i)**2)
        prof = -depth * np.exp(-(d / (r_i * 0.8))**2) + rim * np.exp(-((d - r_i) / (r_i * 0.25))**2)
        z += prof

    # 4. Delta fan & Neretva Vallis canyon breach
    canyon_x = km_x - (-18.0)
    canyon_y = km_y - 8.0
    channel_dist = np.abs(canyon_y - 0.4 * canyon_x)
    channel = -130.0 * np.exp(-(channel_dist / 1.3)**2) * (km_x < -5.0)
    z += channel

    # Delta scarp lobes (elevated delta deposit fan)
    delta_dist = np.sqrt((km_x - (-10.0))**2 + (km_y - 2.0)**2)
    delta = 85.0 * np.exp(-(delta_dist / 5.2)**2) * (km_x > -13.0) * (km_x < -1.5)
    z += delta

    # 5. Séítah dune ripples and fractured terrain
    dune_mask = np.exp(-(((km_x + 4.0)/4.5)**2 + ((km_y + 3.0)/3.2)**2))
    dune_ripples = 15.0 * np.sin(km_x * 4.2 + km_y * 1.8) * dune_mask
    z += dune_ripples

    # 6. Multi-scale fractal micro-roughness
    np.random.seed(1337)
    for freq, amp in [(0.04, 35.0), (0.08, 18.0), (0.2, 8.0), (0.5, 3.5), (1.2, 1.2)]:
        rx = np.random.randn(int(width * freq) + 4, int(height * freq) + 4)
        rx_im = Image.fromarray(rx.astype(np.float32)).resize((width, height), Image.Resampling.BICUBIC)
        z += np.array(rx_im) * amp

    # 7. Horn's analytical slope and aspect calculation
    # dx, dy cell size in meters
    cell_x_m = (lon_max - lon_min) * 56300.0 / width
    cell_y_m = (lat_max - lat_min) * 59300.0 / height

    dz_dy, dz_dx = np.gradient(z, cell_y_m, cell_x_m)
    # Invert dz_dy since array row 0 is top (North)
    p = dz_dx
    q = -dz_dy

    # Sun position: Azimuth 315° (North-West), Altitude 45°
    sun_az = np.radians(315.0)
    sun_alt = np.radians(45.0)

    # Shaded relief formula (Horn 1981)
    cos_zenith = np.sin(sun_alt)
    sin_zenith = np.cos(sun_alt)

    illum = (cos_zenith - sin_zenith * (p * np.sin(sun_az) + q * np.cos(sun_az))) / np.sqrt(1.0 + p**2 + q**2)
    illum = np.clip(illum, 0.0, 1.0)

    # Enhance contrast with smooth non-linear curve
    illum_curved = np.power(illum, 0.85)

    # 8. Photorealistic Martian Terracotta / Ochre Color Palette
    # Highlights: warm golden peach (#e89762)
    # Midtones: rich Martian terracotta (#b8572d)
    # Shadow: deep basaltic burnt umber with red atmospheric bounce (#582412)
    col_shadow = np.array([88.0, 36.0, 18.0])
    col_mid = np.array([184.0, 88.0, 45.0])
    col_high = np.array([232.0, 152.0, 98.0])

    rgb = np.zeros((height, width, 3), dtype=np.float32)

    # Smooth piece-wise color interpolation
    mid_split = 0.48
    mask_low = illum_curved < mid_split
    t_low = illum_curved / mid_split
    t_high = (illum_curved - mid_split) / (1.0 - mid_split)

    for c in range(3):
        rgb[:, :, c] = np.where(
            mask_low,
            col_shadow[c] * (1.0 - t_low) + col_mid[c] * t_low,
            col_mid[c] * (1.0 - t_high) + col_high[c] * t_high
        )

    # Add subtle elevation tint (higher rims slightly lighter ochre, deep craters richer red)
    z_norm = (z - z.min()) / (z.max() - z.min())
    rgb[:, :, 0] += (z_norm - 0.5) * 12.0
    rgb[:, :, 1] += (z_norm - 0.5) * 8.0
    rgb[:, :, 2] += (z_norm - 0.5) * 4.0

    # 9. Alpha channel with smooth edge feathering on the outer 3%
    feather_px = int(width * 0.035)
    alpha = np.ones((height, width), dtype=np.float32)

    # Horizontal feather
    ramp_x = np.linspace(0.0, 1.0, feather_px)
    alpha[:, :feather_px] = np.minimum(alpha[:, :feather_px], ramp_x[np.newaxis, :])
    alpha[:, -feather_px:] = np.minimum(alpha[:, -feather_px:], ramp_x[::-1][np.newaxis, :])

    # Vertical feather
    ramp_y = np.linspace(0.0, 1.0, feather_px)
    alpha[:feather_px, :] = np.minimum(alpha[:feather_px, :], ramp_y[:, np.newaxis])
    alpha[-feather_px:, :] = np.minimum(alpha[-feather_px:, :], ramp_y[::-1][:, np.newaxis])

    # Smoothstep on alpha
    alpha = alpha * alpha * (3.0 - 2.0 * alpha)

    rgba = np.zeros((height, width, 4), dtype=np.uint8)
    rgba[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    rgba[:, :, 3] = np.clip(alpha * 255.0, 0, 255).astype(np.uint8)

    out_img = Image.fromarray(rgba, mode='RGBA')
    out_path = 'public/mars-data/jezero_wide_shaded_relief.png'
    out_img.save(out_path, format='PNG', optimize=True)
    print(f'Successfully generated photorealistic Mars relief: {out_path} ({width}x{height})')

if __name__ == '__main__':
    generate_mars_relief()
