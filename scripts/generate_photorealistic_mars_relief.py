import numpy as np
from PIL import Image

def generate_mars_relief():
    width, height = 2048, 2048
    lon_min, lon_max = 76.95, 77.95
    lat_min, lat_max = 18.10, 19.00

    x = np.linspace(lon_min, lon_max, width)
    y = np.linspace(lat_max, lat_min, height) # Row 0 is North
    lon_grid, lat_grid = np.meshgrid(x, y)

    # Reference center at Jezero route center (77.445°E, 18.450°N)
    cx, cy = 77.445, 18.450
    km_x = (lon_grid - cx) * 56.3
    km_y = (lat_grid - cy) * 59.3

    # Base regional depression
    dist_basin = np.sqrt(km_x**2 + km_y**2)
    z = -2580.0 + 380.0 / (1.0 + np.exp(-(dist_basin - 18.0) / 3.0))

    def stamp_crater(z_map, px, py, r_km, depth_m, rim_m):
        d_km = np.sqrt((km_x - px)**2 + (km_y - py)**2)
        inner_mask = d_km < r_km
        bowl = -depth_m + (depth_m + rim_m) * (d_km / r_km)**2.6
        outer_ejecta = rim_m * np.exp(-((np.maximum(0.0, d_km - r_km)) / (r_km * 0.42))**1.6)
        crater_z = np.where(inner_mask, bowl, outer_ejecta)
        return z_map + crater_z

    # 1. Prominent Southern Impact Crater matching reference mockup
    z = stamp_crater(z, 2.0, -7.2, 4.4, 880.0, 270.0)

    # 2. Medium Impact Craters across the scene matching reference
    craters = [
        (-7.0, -4.8, 1.9, 480.0, 150.0), # Southwest crater near Start
        (4.2, 2.8, 2.3, 540.0, 170.0),   # Belva crater
        (-1.8, 5.8, 2.6, 600.0, 190.0),  # North delta crater
        (7.2, -2.8, 2.1, 500.0, 160.0),  # Southeast crater
        (-9.0, 3.5, 2.4, 530.0, 170.0),  # Northwest delta rim crater
        (2.8, 7.0, 1.7, 440.0, 140.0),   # Northeast plain crater
        (-4.2, -8.5, 1.6, 410.0, 130.0), # Far south crater
        (6.0, 7.5, 2.0, 490.0, 160.0),   # Far northeast crater near Destination
        (-1.4, 2.0, 1.1, 320.0, 100.0),  # Central plain crater
        (2.2, -1.4, 1.0, 290.0, 90.0),   # Central corridor crater
        (-4.8, 0.9, 0.9, 260.0, 80.0),   # Delta bottomset crater
        (9.2, 1.8, 2.5, 560.0, 180.0),   # East basin rim crater
        (-8.2, -1.8, 1.4, 360.0, 115.0), # West delta flank crater
        (0.5, 10.5, 3.0, 640.0, 200.0),  # North rim boundary crater
        (-10.5, 9.0, 2.5, 550.0, 175.0), # Far NW canyon crater
        (10.0, 8.5, 2.8, 590.0, 185.0),  # Far NE rim crater
    ]

    for px, py, r, d, rim in craters:
        z = stamp_crater(z, px, py, r, d, rim)

    # 3. Western Delta fan elevated lobes and distributary channels
    delta_x = km_x - (-6.0)
    delta_y = km_y - 1.8
    delta_r = np.sqrt(delta_x**2 + delta_y**2)
    delta_elevation = 150.0 * np.exp(-(delta_r / 6.0)**2) * (km_x < 1.5)
    scarp_mask = np.tanh((1.8 - (delta_x / 3.8)) * 2.5) * 60.0 * (km_x < 2.0)
    z += delta_elevation + scarp_mask

    # Distributary channel incision (Neretva Vallis breach)
    ch_dist = np.abs(km_y - (0.42 * km_x + 4.5))
    channel_cut = -130.0 * np.exp(-(ch_dist / 1.1)**2) * (km_x < 3.5)
    z += channel_cut

    # 4. Séítah dune ripple field (active aeolian sand corridor)
    dune_envelope = np.exp(-(((km_x - 0.4) / 3.0)**2 + ((km_y + 1.2) / 2.2)**2))
    ripple_phase = (km_x * 7.5 + km_y * 3.8) * 2.0 * np.pi
    dune_ripples = 18.0 * (np.sin(ripple_phase) + 0.35 * np.sin(2.0 * ripple_phase)) * dune_envelope
    z += dune_ripples

    # 5. Fractal Martian micro-roughness
    np.random.seed(4242)
    for freq, amp in [(0.02, 28.0), (0.05, 16.0), (0.12, 8.0), (0.35, 3.5), (0.9, 1.2)]:
        rx = np.random.randn(int(width * freq) + 4, int(height * freq) + 4)
        rx_im = Image.fromarray(rx.astype(np.float32)).resize((width, height), Image.Resampling.BICUBIC)
        z += np.array(rx_im) * amp

    # 6. High-Contrast Horn Analytical Shading (Sun from NW 315° at 36° elevation)
    cell_x_m = (lon_max - lon_min) * 56300.0 / width
    cell_y_m = (lat_max - lat_min) * 59300.0 / height

    dz_dy, dz_dx = np.gradient(z, cell_y_m, cell_x_m)
    p = dz_dx
    q = -dz_dy # Invert because row 0 is North

    sun_az = np.radians(315.0)
    sun_alt = np.radians(36.0)

    cos_zenith = np.sin(sun_alt)
    sin_zenith = np.cos(sun_alt)

    denom = np.sqrt(1.0 + p**2 + q**2)
    illum = (cos_zenith - sin_zenith * (p * np.sin(sun_az) + q * np.cos(sun_az))) / denom
    illum = np.clip(illum, 0.0, 1.0)

    # Gamma contrast curve for rich deep shadows and crisp rims
    illum_curved = np.where(
        illum < 0.45,
        0.45 * (np.maximum(0.0, illum) / 0.45)**1.60,
        0.45 + 0.55 * (np.maximum(0.0, illum - 0.45) / 0.55)**0.82
    )

    # 7. Authentic Martian Terracotta / Basalt Ochre Color Palette
    col_shadow = np.array([36.0, 15.0, 10.0])
    col_mid = np.array([180.0, 86.0, 45.0])
    col_high = np.array([248.0, 180.0, 124.0])

    rgb = np.zeros((height, width, 3), dtype=np.float32)
    mid_split = 0.45
    mask_low = illum_curved < mid_split
    t_low = illum_curved / mid_split
    t_high = (illum_curved - mid_split) / (1.0 - mid_split)

    for c in range(3):
        rgb[:, :, c] = np.where(
            mask_low,
            col_shadow[c] * (1.0 - t_low) + col_mid[c] * t_low,
            col_mid[c] * (1.0 - t_high) + col_high[c] * t_high
        )

    # Subtle dune color variation
    rgb[:, :, 0] += dune_envelope * 18.0
    rgb[:, :, 1] += dune_envelope * 12.0
    rgb[:, :, 2] += dune_envelope * 2.0

    # 8. Subtle feathering on outermost 2.5%
    feather_px = int(width * 0.025)
    alpha = np.ones((height, width), dtype=np.float32)
    ramp_x = np.linspace(0.0, 1.0, feather_px)
    alpha[:, :feather_px] = np.minimum(alpha[:, :feather_px], ramp_x[np.newaxis, :])
    alpha[:, -feather_px:] = np.minimum(alpha[:, -feather_px:], ramp_x[::-1][np.newaxis, :])
    ramp_y = np.linspace(0.0, 1.0, feather_px)
    alpha[:feather_px, :] = np.minimum(alpha[:feather_px, :], ramp_y[:, np.newaxis])
    alpha[-feather_px:, :] = np.minimum(alpha[-feather_px:], ramp_y[::-1][:, np.newaxis])
    alpha = alpha * alpha * (3.0 - 2.0 * alpha)

    rgba = np.zeros((height, width, 4), dtype=np.uint8)
    rgba[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    rgba[:, :, 3] = np.clip(alpha * 255.0, 0, 255).astype(np.uint8)

    out_img = Image.fromarray(rgba, mode='RGBA')
    out_path = 'public/mars-data/jezero_wide_shaded_relief.png'
    out_img.save(out_path, format='PNG', optimize=True)
    print(f'Successfully generated photorealistic Mars relief: {out_path} ({width}x{height})')
    print(f'Bounds: [{lat_min}, {lat_max}] N, [{lon_min}, {lon_max}] E')

if __name__ == '__main__':
    generate_mars_relief()
