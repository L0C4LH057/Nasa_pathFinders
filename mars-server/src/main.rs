#![forbid(unsafe_code)]

use axum::{
    extract::State,
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::{
    cmp::Ordering,
    collections::BinaryHeap,
    fs,
    net::SocketAddr,
    sync::Arc,
    time::Instant,
};
use tower_http::cors::CorsLayer;

const MARS_EQUATORIAL_RADIUS_M: f64 = 3396190.0;
#[allow(dead_code)]
const MARS_POLAR_RADIUS_M: f64 = 3376200.0;

#[derive(Clone)]
pub struct DtmGrid {
    pub rows: usize,
    pub cols: usize,
    pub min_lat: f64,
    pub max_lat: f64,
    pub min_lon: f64,
    pub max_lon: f64,
    pub cell_size_x_m: f64,
    pub cell_size_y_m: f64,
    pub min_elevation_m: f32,
    pub max_elevation_m: f32,
    pub elevations: Vec<f32>,
    pub slopes: Vec<f32>,
    pub hazard_mask: Vec<f32>,
    pub uncertainty_mask: Vec<f32>,
}

impl DtmGrid {
    pub fn index(&self, r: usize, c: usize) -> usize {
        r * self.cols + c
    }

    pub fn rc(&self, idx: usize) -> (usize, usize) {
        (idx / self.cols, idx % self.cols)
    }

    pub fn coords_to_rc(&self, lat: f64, lon: f64) -> (usize, usize) {
        let lat_clamped = lat.clamp(self.min_lat, self.max_lat);
        let lon_clamped = lon.clamp(self.min_lon, self.max_lon);

        let r = (((self.max_lat - lat_clamped) / (self.max_lat - self.min_lat))
            * (self.rows - 1) as f64)
            .round() as usize;
        let c = (((lon_clamped - self.min_lon) / (self.max_lon - self.min_lon))
            * (self.cols - 1) as f64)
            .round() as usize;

        (r.min(self.rows - 1), c.min(self.cols - 1))
    }

    pub fn rc_to_coords(&self, r: usize, c: usize) -> (f64, f64) {
        let lat = self.max_lat - (r as f64 / (self.rows - 1) as f64) * (self.max_lat - self.min_lat);
        let lon = self.min_lon + (c as f64 / (self.cols - 1) as f64) * (self.max_lon - self.min_lon);
        (lat, lon)
    }

    pub fn compute_horn_slopes(&mut self) {
        let mut slopes = vec![0.0f32; self.rows * self.cols];
        let d_phi = (self.max_lat - self.min_lat).to_radians() / (self.rows - 1) as f64;
        let d_lambda = (self.max_lon - self.min_lon).to_radians() / (self.cols - 1) as f64;
        let dy = MARS_EQUATORIAL_RADIUS_M * d_phi;

        for r in 0..self.rows {
            let lat = self.max_lat - (r as f64 / (self.rows - 1) as f64) * (self.max_lat - self.min_lat);
            let dx = MARS_EQUATORIAL_RADIUS_M * lat.to_radians().cos() * d_lambda;

            for c in 0..self.cols {
                let r_prev = if r == 0 { 0 } else { r - 1 };
                let r_next = if r == self.rows - 1 { self.rows - 1 } else { r + 1 };
                let c_prev = if c == 0 { 0 } else { c - 1 };
                let c_next = if c == self.cols - 1 { self.cols - 1 } else { c + 1 };

                let z00 = self.elevations[self.index(r_prev, c_prev)] as f64;
                let z01 = self.elevations[self.index(r_prev, c)] as f64;
                let z02 = self.elevations[self.index(r_prev, c_next)] as f64;
                let z10 = self.elevations[self.index(r, c_prev)] as f64;
                let z12 = self.elevations[self.index(r, c_next)] as f64;
                let z20 = self.elevations[self.index(r_next, c_prev)] as f64;
                let z21 = self.elevations[self.index(r_next, c)] as f64;
                let z22 = self.elevations[self.index(r_next, c_next)] as f64;

                let p = ((z02 + 2.0 * z12 + z22) - (z00 + 2.0 * z10 + z20)) / (8.0 * dx);
                let q = ((z20 + 2.0 * z21 + z22) - (z00 + 2.0 * z01 + z02)) / (8.0 * dy);

                let slope_rad = (p * p + q * q).sqrt().atan();
                let slope_deg = slope_rad.to_degrees() as f32;
                slopes[self.index(r, c)] = slope_deg;
            }
        }
        self.slopes = slopes;
    }
}

#[derive(Debug, Deserialize)]
pub struct RawDtmFile {
    pub rows: usize,
    pub cols: usize,
    pub bounds: Bounds,
    pub elevations: Vec<f32>,
    pub hazard_mask: Vec<f32>,
    pub uncertainty_mask: Vec<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bounds {
    pub min_lat: f64,
    pub max_lat: f64,
    pub min_lon: f64,
    pub max_lon: f64,
}

#[derive(Debug, Deserialize)]
pub struct RouteRequest {
    pub start: [f64; 2],
    pub goal: [f64; 2],
    #[serde(default = "default_max_slope")]
    pub max_slope_deg: f64,
    #[serde(default = "default_w_slope")]
    pub w_slope: f64,
    #[serde(default = "default_w_hazard")]
    pub w_hazard: f64,
    #[serde(default = "default_w_uncertainty")]
    pub w_uncertainty: f64,
    #[serde(default = "default_walk_speed")]
    pub walk_speed_kmh: f64,
    #[serde(default = "default_o2_rate")]
    pub o2_rate_lpm: f64,
    #[serde(default = "default_battery_draw")]
    pub battery_wh_per_hr: f64,
}

fn default_max_slope() -> f64 { 18.0 }
fn default_w_slope() -> f64 { 3.5 }
fn default_w_hazard() -> f64 { 6.0 }
fn default_w_uncertainty() -> f64 { 4.0 }
fn default_walk_speed() -> f64 { 2.4 }
fn default_o2_rate() -> f64 { 1.1 }
fn default_battery_draw() -> f64 { 130.0 }

#[derive(Debug, Serialize)]
pub struct RouteResponse {
    pub outbound: RouteLeg,
    pub return_leg: RouteLeg,
    pub resources: EvaResources,
    pub assumptions_disclaimer: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct RouteLeg {
    pub reachable: bool,
    pub points: Vec<RoutePoint>,
    pub distance_m: f64,
    pub elevation_gain_m: f64,
    pub elevation_loss_m: f64,
    pub max_slope_deg: f64,
    pub mean_slope_deg: f64,
    pub high_uncertainty_pct: f64,
    pub model_cost: f64,
    pub astar_nodes_explored: usize,
    pub astar_time_us: u128,
    pub dijkstra_nodes_explored: usize,
    pub dijkstra_time_us: u128,
}

#[derive(Debug, Clone, Serialize)]
pub struct RoutePoint {
    pub lat: f64,
    pub lon: f64,
    pub elevation_m: f32,
    pub slope_deg: f32,
    pub cumulative_dist_m: f64,
    pub uncertainty: f32,
}

#[derive(Debug, Serialize)]
pub struct EvaResources {
    pub total_distance_km: f64,
    pub estimated_duration_hr: f64,
    pub o2_required_liters: f64,
    pub o2_capacity_liters: f64,
    pub battery_required_wh: f64,
    pub battery_capacity_wh: f64,
    pub reserve_policy_pct: f64,
    pub fits_within_limits: bool,
    pub limiting_factor: String,
}

#[derive(Debug, Serialize)]
pub struct ProblemDetails {
    pub r#type: String,
    pub title: String,
    pub status: u16,
    pub detail: String,
    pub instance: String,
}

impl IntoResponse for ProblemDetails {
    fn into_response(self) -> Response {
        let status = StatusCode::from_u16(self.status).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
        let body = Json(self);
        (status, [(header::CONTENT_TYPE, "application/problem+json")], body).into_response()
    }
}

#[derive(Copy, Clone, PartialEq)]
struct HeapItem {
    priority: f64,
    node: usize,
}

impl Eq for HeapItem {}

impl Ord for HeapItem {
    fn cmp(&self, other: &Self) -> Ordering {
        other.priority.partial_cmp(&self.priority).unwrap_or(Ordering::Equal)
    }
}

impl PartialOrd for HeapItem {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

pub struct SearchResult {
    pub reachable: bool,
    pub path_indices: Vec<usize>,
    pub model_cost: f64,
    pub nodes_explored: usize,
    pub elapsed_us: u128,
}

pub fn run_search(
    grid: &DtmGrid,
    start_idx: usize,
    goal_idx: usize,
    req: &RouteRequest,
    use_heuristic: bool,
) -> SearchResult {
    let start_time = Instant::now();
    let total_nodes = grid.rows * grid.cols;

    let mut g_score = vec![f64::INFINITY; total_nodes];
    let mut came_from = vec![usize::MAX; total_nodes];
    let mut open_set = BinaryHeap::new();
    let mut nodes_explored = 0;

    let (goal_r, goal_c) = grid.rc(goal_idx);
    let (goal_lat, goal_lon) = grid.rc_to_coords(goal_r, goal_c);
    let goal_elev = grid.elevations[goal_idx] as f64;

    g_score[start_idx] = 0.0;

    let initial_h = if use_heuristic {
        let (s_r, s_c) = grid.rc(start_idx);
        let (s_lat, s_lon) = grid.rc_to_coords(s_r, s_c);
        let s_elev = grid.elevations[start_idx] as f64;
        calc_3d_dist(s_lat, s_lon, s_elev, goal_lat, goal_lon, goal_elev)
    } else {
        0.0
    };

    open_set.push(HeapItem {
        priority: initial_h,
        node: start_idx,
    });

    let neighbor_offsets: [(isize, isize); 8] = [
        (-1, -1), (-1, 0), (-1, 1),
        (0, -1),           (0, 1),
        (1, -1),  (1, 0),  (1, 1),
    ];

    while let Some(HeapItem { priority: _, node: current }) = open_set.pop() {
        nodes_explored += 1;

        if current == goal_idx {
            let elapsed_us = start_time.elapsed().as_micros();
            let mut path_indices = Vec::new();
            let mut curr = goal_idx;
            while curr != start_idx {
                path_indices.push(curr);
                curr = came_from[curr];
            }
            path_indices.push(start_idx);
            path_indices.reverse();

            return SearchResult {
                reachable: true,
                path_indices,
                model_cost: g_score[goal_idx],
                nodes_explored,
                elapsed_us,
            };
        }

        let (r, c) = grid.rc(current);
        let (lat_u, lon_u) = grid.rc_to_coords(r, c);
        let elev_u = grid.elevations[current] as f64;

        for (dr, dc) in neighbor_offsets {
            let nr = r as isize + dr;
            let nc = c as isize + dc;

            if nr < 0 || nr >= grid.rows as isize || nc < 0 || nc >= grid.cols as isize {
                continue;
            }

            let neighbor = grid.index(nr as usize, nc as usize);
            let slope_v = grid.slopes[neighbor] as f64;
            let hazard_v = grid.hazard_mask[neighbor] as f64;
            let uncertainty_v = grid.uncertainty_mask[neighbor] as f64;

            // Hard Exclusion Barriers
            if slope_v > req.max_slope_deg || hazard_v >= 0.99 || uncertainty_v >= 0.99 {
                continue;
            }

            let (lat_v, lon_v) = grid.rc_to_coords(nr as usize, nc as usize);
            let elev_v = grid.elevations[neighbor] as f64;
            let d3d = calc_3d_dist(lat_u, lon_u, elev_u, lat_v, lon_v, elev_v);

            // Asymmetric uphill factor
            let dz = elev_v - elev_u;
            let uphill_factor = 1.0 + 2.5 * (dz.max(0.0) / d3d);

            let slope_ratio = slope_v / req.max_slope_deg;
            let step_cost = d3d * (
                uphill_factor
                + req.w_slope * (slope_ratio * slope_ratio)
                + req.w_hazard * hazard_v
                + req.w_uncertainty * uncertainty_v
            );

            let tentative_g = g_score[current] + step_cost;
            if tentative_g < g_score[neighbor] {
                came_from[neighbor] = current;
                g_score[neighbor] = tentative_g;

                let h = if use_heuristic {
                    calc_3d_dist(lat_v, lon_v, elev_v, goal_lat, goal_lon, goal_elev)
                } else {
                    0.0
                };

                open_set.push(HeapItem {
                    priority: tentative_g + h,
                    node: neighbor,
                });
            }
        }
    }

    SearchResult {
        reachable: false,
        path_indices: Vec::new(),
        model_cost: f64::INFINITY,
        nodes_explored,
        elapsed_us: start_time.elapsed().as_micros(),
    }
}

pub fn calc_3d_dist(lat1: f64, lon1: f64, z1: f64, lat2: f64, lon2: f64, z2: f64) -> f64 {
    let phi_mid = ((lat1 + lat2) / 2.0).to_radians();
    let d_lat = (lat2 - lat1).to_radians();
    let d_lon = (lon2 - lon1).to_radians();

    let dx = MARS_EQUATORIAL_RADIUS_M * phi_mid.cos() * d_lon;
    let dy = MARS_EQUATORIAL_RADIUS_M * d_lat;
    let dz = z2 - z1;

    (dx * dx + dy * dy + dz * dz).sqrt()
}

pub fn build_route_leg(
    grid: &DtmGrid,
    search_astar: &SearchResult,
    search_dijkstra: &SearchResult,
) -> RouteLeg {
    if !search_astar.reachable || search_astar.path_indices.is_empty() {
        return RouteLeg {
            reachable: false,
            points: Vec::new(),
            distance_m: 0.0,
            elevation_gain_m: 0.0,
            elevation_loss_m: 0.0,
            max_slope_deg: 0.0,
            mean_slope_deg: 0.0,
            high_uncertainty_pct: 0.0,
            model_cost: f64::INFINITY,
            astar_nodes_explored: search_astar.nodes_explored,
            astar_time_us: search_astar.elapsed_us,
            dijkstra_nodes_explored: search_dijkstra.nodes_explored,
            dijkstra_time_us: search_dijkstra.elapsed_us,
        };
    }

    let mut points = Vec::new();
    let mut total_distance = 0.0;
    let mut elevation_gain = 0.0;
    let mut elevation_loss = 0.0;
    let mut max_slope: f64 = 0.0;
    let mut slope_sum: f64 = 0.0;
    let mut coarse_points = 0;

    let mut prev_point: Option<(f64, f64, f64)> = None;

    for &idx in &search_astar.path_indices {
        let (r, c) = grid.rc(idx);
        let (lat, lon) = grid.rc_to_coords(r, c);
        let elev = grid.elevations[idx];
        let slope = grid.slopes[idx];
        let uncertainty = grid.uncertainty_mask[idx];

        if let Some((p_lat, p_lon, p_elev)) = prev_point {
            let step_d = calc_3d_dist(p_lat, p_lon, p_elev, lat, lon, elev as f64);
            total_distance += step_d;
            let dz = (elev as f64) - p_elev;
            if dz > 0.0 {
                elevation_gain += dz;
            } else {
                elevation_loss += dz.abs();
            }
        }

        if (slope as f64) > max_slope {
            max_slope = slope as f64;
        }
        slope_sum += slope as f64;

        if uncertainty > 0.5 {
            coarse_points += 1;
        }

        points.push(RoutePoint {
            lat,
            lon,
            elevation_m: elev,
            slope_deg: slope,
            cumulative_dist_m: total_distance,
            uncertainty,
        });

        prev_point = Some((lat, lon, elev as f64));
    }

    let num_pts = points.len().max(1) as f64;
    let mean_slope = slope_sum / num_pts;
    let high_uncertainty_pct = (coarse_points as f64 / num_pts) * 100.0;

    RouteLeg {
        reachable: true,
        points,
        distance_m: (total_distance * 10.0).round() / 10.0,
        elevation_gain_m: (elevation_gain * 10.0).round() / 10.0,
        elevation_loss_m: (elevation_loss * 10.0).round() / 10.0,
        max_slope_deg: (max_slope * 10.0).round() / 10.0,
        mean_slope_deg: (mean_slope * 10.0).round() / 10.0,
        high_uncertainty_pct: (high_uncertainty_pct * 10.0).round() / 10.0,
        model_cost: (search_astar.model_cost * 10.0).round() / 10.0,
        astar_nodes_explored: search_astar.nodes_explored,
        astar_time_us: search_astar.elapsed_us,
        dijkstra_nodes_explored: search_dijkstra.nodes_explored,
        dijkstra_time_us: search_dijkstra.elapsed_us,
    }
}

pub struct AppState {
    pub grid: DtmGrid,
    pub features_geojson: String,
    pub provenance_json: String,
}

async fn get_grid_summary(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let summary = serde_json::json!({
        "rows": state.grid.rows,
        "cols": state.grid.cols,
        "bounds": {
            "min_lat": state.grid.min_lat,
            "max_lat": state.grid.max_lat,
            "min_lon": state.grid.min_lon,
            "max_lon": state.grid.max_lon
        },
        "cell_size_x_m": (state.grid.cell_size_x_m * 100.0).round() / 100.0,
        "cell_size_y_m": (state.grid.cell_size_y_m * 100.0).round() / 100.0,
        "min_elevation_m": state.grid.min_elevation_m,
        "max_elevation_m": state.grid.max_elevation_m,
        "geodetic_datum": "IAU_2015:49900"
    });
    Json(summary)
}

async fn get_features(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    ([(header::CONTENT_TYPE, "application/geo+json")], state.features_geojson.clone())
}

async fn get_provenance(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    ([(header::CONTENT_TYPE, "application/json")], state.provenance_json.clone())
}

async fn post_route(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<RouteRequest>,
) -> Result<Json<RouteResponse>, ProblemDetails> {
    // 1. NaN and Inf check
    if payload.start.iter().any(|&v| v.is_nan() || v.is_infinite())
        || payload.goal.iter().any(|&v| v.is_nan() || v.is_infinite())
    {
        return Err(ProblemDetails {
            r#type: "https://mars-pathfinder.local/errors/invalid-parameters".into(),
            title: "Invalid Floating Point Parameters".into(),
            status: 400,
            detail: "Start or goal coordinates contain NaN or Infinite values.".into(),
            instance: "/api/mars/route".into(),
        });
    }

    // 2. Bound validation
    let (s_lat, s_lon) = (payload.start[0], payload.start[1]);
    let (g_lat, g_lon) = (payload.goal[0], payload.goal[1]);

    if s_lat < state.grid.min_lat || s_lat > state.grid.max_lat
        || s_lon < state.grid.min_lon || s_lon > state.grid.max_lon
    {
        return Err(ProblemDetails {
            r#type: "https://mars-pathfinder.local/errors/out-of-bounds".into(),
            title: "Start Coordinate Out of Bounds".into(),
            status: 400,
            detail: format!(
                "Start coordinate [{}, {}] is outside Jezero Pilot DTM bounds [{}, {}] to [{}, {}].",
                s_lat, s_lon, state.grid.min_lat, state.grid.min_lon, state.grid.max_lat, state.grid.max_lon
            ),
            instance: "/api/mars/route".into(),
        });
    }

    if g_lat < state.grid.min_lat || g_lat > state.grid.max_lat
        || g_lon < state.grid.min_lon || g_lon > state.grid.max_lon
    {
        return Err(ProblemDetails {
            r#type: "https://mars-pathfinder.local/errors/out-of-bounds".into(),
            title: "Goal Coordinate Out of Bounds".into(),
            status: 400,
            detail: format!(
                "Goal coordinate [{}, {}] is outside Jezero Pilot DTM bounds [{}, {}] to [{}, {}].",
                g_lat, g_lon, state.grid.min_lat, state.grid.min_lon, state.grid.max_lat, state.grid.max_lon
            ),
            instance: "/api/mars/route".into(),
        });
    }

    let (s_r, s_c) = state.grid.coords_to_rc(s_lat, s_lon);
    let (g_r, g_c) = state.grid.coords_to_rc(g_lat, g_lon);

    let start_idx = state.grid.index(s_r, s_c);
    let goal_idx = state.grid.index(g_r, g_c);

    // Compute Outbound: A* and Dijkstra
    let outbound_astar = run_search(&state.grid, start_idx, goal_idx, &payload, true);
    let outbound_dijkstra = run_search(&state.grid, start_idx, goal_idx, &payload, false);
    let outbound = build_route_leg(&state.grid, &outbound_astar, &outbound_dijkstra);

    // Compute Return: A* and Dijkstra
    let return_astar = run_search(&state.grid, goal_idx, start_idx, &payload, true);
    let return_dijkstra = run_search(&state.grid, goal_idx, start_idx, &payload, false);
    let return_leg = build_route_leg(&state.grid, &return_astar, &return_dijkstra);

    // EVA Resource Calculator
    let total_dist_km = (outbound.distance_m + return_leg.distance_m) / 1000.0;
    let walk_speed = payload.walk_speed_kmh.max(0.1);
    let walking_duration_hr = total_dist_km / walk_speed;
    let science_stop_hr = 0.5; // 30 minutes at target
    let total_duration_hr = walking_duration_hr + science_stop_hr;

    let o2_capacity = 550.0;
    let o2_required = payload.o2_rate_lpm * (total_duration_hr * 60.0);

    let battery_capacity = 850.0;
    let battery_required = payload.battery_wh_per_hr * total_duration_hr;

    let max_usable_pct = 75.0; // 25% safety reserve policy
    let o2_usage_pct = (o2_required / o2_capacity) * 100.0;
    let bat_usage_pct = (battery_required / battery_capacity) * 100.0;

    let fits = outbound.reachable
        && return_leg.reachable
        && o2_usage_pct <= max_usable_pct
        && bat_usage_pct <= max_usable_pct;

    let limiting_factor = if !outbound.reachable || !return_leg.reachable {
        "NO-GO: Terrain obstacle or slope cutoff blocks passage.".to_string()
    } else if o2_usage_pct > max_usable_pct && bat_usage_pct > max_usable_pct {
        format!("NO-GO: Both O2 ({:.1}%) and Battery ({:.1}%) exceed 25% safety reserve.", o2_usage_pct, bat_usage_pct)
    } else if o2_usage_pct > max_usable_pct {
        format!("NO-GO: O2 consumption ({:.1}%) exceeds 25% safety reserve.", o2_usage_pct)
    } else if bat_usage_pct > max_usable_pct {
        format!("NO-GO: Battery energy draw ({:.1}%) exceeds 25% safety reserve.", bat_usage_pct)
    } else {
        "Nominal — Outbound + Return + 30m Science Stop fits within 25% safety reserve.".to_string()
    };

    let resources = EvaResources {
        total_distance_km: (total_dist_km * 100.0).round() / 100.0,
        estimated_duration_hr: (total_duration_hr * 100.0).round() / 100.0,
        o2_required_liters: (o2_required * 10.0).round() / 10.0,
        o2_capacity_liters: o2_capacity,
        battery_required_wh: (battery_required * 10.0).round() / 10.0,
        battery_capacity_wh: battery_capacity,
        reserve_policy_pct: 25.0,
        fits_within_limits: fits,
        limiting_factor,
    };

    Ok(Json(RouteResponse {
        outbound,
        return_leg,
        resources,
        assumptions_disclaimer: "MARS PATHFINDER is a research and decision-support prototype. It is not a flight-certified navigation system, a real spacesuit telemetry monitor, a guarantee of astronaut safety, or a substitute for NASA Mission Control. All slope cutoffs, mobility weights, and EVA resource rates are configurable prototype assumptions.".to_string(),
    }))
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter("info")
        .init();

    println!("[INFO] 🔴 Initializing MARS PATHFINDER Geospatial & Pathfinding Engine v0.1.0");

    let dtm_path = "data/jezero_dtm.json";
    let dtm_str = fs::read_to_string(dtm_path).unwrap_or_else(|_| {
        fs::read_to_string("mars-server/data/jezero_dtm.json")
            .expect("Failed to load jezero_dtm.json")
    });
    let raw: RawDtmFile = serde_json::from_str(&dtm_str).expect("Failed to parse jezero_dtm.json");

    let min_elev = raw.elevations.iter().copied().fold(f32::INFINITY, f32::min);
    let max_elev = raw.elevations.iter().copied().fold(f32::NEG_INFINITY, f32::max);

    let d_phi = (raw.bounds.max_lat - raw.bounds.min_lat).to_radians() / (raw.rows - 1) as f64;
    let d_lambda = (raw.bounds.max_lon - raw.bounds.min_lon).to_radians() / (raw.cols - 1) as f64;
    let mid_phi = ((raw.bounds.min_lat + raw.bounds.max_lat) / 2.0).to_radians();

    let cell_size_y = MARS_EQUATORIAL_RADIUS_M * d_phi;
    let cell_size_x = MARS_EQUATORIAL_RADIUS_M * mid_phi.cos() * d_lambda;

    let mut grid = DtmGrid {
        rows: raw.rows,
        cols: raw.cols,
        min_lat: raw.bounds.min_lat,
        max_lat: raw.bounds.max_lat,
        min_lon: raw.bounds.min_lon,
        max_lon: raw.bounds.max_lon,
        cell_size_x_m: cell_size_x,
        cell_size_y_m: cell_size_y,
        min_elevation_m: min_elev,
        max_elevation_m: max_elev,
        elevations: raw.elevations,
        slopes: Vec::new(),
        hazard_mask: raw.hazard_mask,
        uncertainty_mask: raw.uncertainty_mask,
    };

    let t0 = Instant::now();
    grid.compute_horn_slopes();
    println!("[INFO] Computed Horn's slope convolution in {:.2}ms for {} cells", t0.elapsed().as_secs_f64() * 1000.0, grid.rows * grid.cols);

    let features_path = "data/jezero_features.geojson";
    let features_str = fs::read_to_string(features_path).unwrap_or_else(|_| {
        fs::read_to_string("mars-server/data/jezero_features.geojson")
            .expect("Failed to load jezero_features.geojson")
    });

    let provenance_json = serde_json::json!({
        "datasets": [
            {
                "id": "viking-mdim21",
                "title": "Viking Orbiter MDIM 2.1 Colorized Global Mosaic",
                "instrument": "Visual Imaging Subsystem (VIS)",
                "mission": "Viking 1 & 2 Orbiters (NASA)",
                "spatial_resolution": "232 m/px",
                "coverage": "Global Mars (100%)",
                "crs": "IAU_2015:49900",
                "pds_product_id": "VO_MDIM_21_GLOBAL",
                "source_url": "https://trek.nasa.gov/mars/",
                "limitations": "Coarse spatial resolution; legacy 1970s orthorectification.",
                "uncertainty_handling": "Regional visual context basemap only."
            },
            {
                "id": "mro-ctx-jezero",
                "title": "MRO CTX Jezero Crater Mosaic",
                "instrument": "Context Camera (CTX)",
                "mission": "Mars Reconnaissance Orbiter (NASA/JPL/Caltech Murray Lab)",
                "spatial_resolution": "6.0 m/px",
                "coverage": "Jezero Crater & Nili Fossae",
                "crs": "IAU_2015:49900",
                "pds_product_id": "MurrayLab_CTX_V01_Jezero",
                "source_url": "http://murray-lab.caltech.edu/CTX/",
                "limitations": "Varying atmospheric dust haze between orbital tracks.",
                "uncertainty_handling": "Draped over DTM terrain to contextualize route corridors."
            },
            {
                "id": "mro-hirise-jezero-dtm",
                "title": "MRO HiRISE Jezero Crater Western Delta DTM",
                "instrument": "High Resolution Imaging Science Experiment (HiRISE)",
                "mission": "Mars Reconnaissance Orbiter (NASA/JPL/Univ of Arizona)",
                "spatial_resolution": "1.0 m/px",
                "coverage": "Jezero Crater Western Delta & Fan deposits",
                "crs": "IAU_2015:49900",
                "pds_product_id": "DTEEC_045994_1985_046060_1985_A01",
                "source_url": "https://www.uahirise.org/dtm/dtm.php?ID=ESP_045994_1985",
                "limitations": "Stereo correlation gaps on featureless dune crests; scarp shadowing.",
                "uncertainty_handling": "Primary substrate for Horn's slope derivation; uncertainty mask U(v) = 0.0."
            },
            {
                "id": "mgs-mola-megdr",
                "title": "MGS MOLA Megascience Elevation Model",
                "instrument": "Mars Orbiter Laser Altimeter (MOLA)",
                "mission": "Mars Global Surveyor (NASA/GSFC)",
                "spatial_resolution": "463 m/px",
                "coverage": "Global Mars (100%)",
                "crs": "IAU_2015:49900 (MOLA Areoid Datum)",
                "pds_product_id": "MGS-M-MOLA-5-MEGDR-L3-V1.0",
                "source_url": "https://pds-geosciences.wustl.edu/missions/mgs/mola.html",
                "limitations": "Coarse footprint (463m) misses meter-scale scarps and boulders.",
                "uncertainty_handling": "Outside HiRISE coverage, terrain uncertainty U(v) = 1.0, incurring high routing penalties."
            },
            {
                "id": "mro-crism-mineralogy",
                "title": "MRO CRISM Targeted Hyperspectral Mineralogy",
                "instrument": "Compact Reconnaissance Imaging Spectrometer for Mars (CRISM)",
                "mission": "Mars Reconnaissance Orbiter (NASA/JHU-APL)",
                "spatial_resolution": "18.0 - 36.0 m/px",
                "coverage": "Targeted Jezero Deltaic Margin",
                "crs": "IAU_2015:49900",
                "pds_product_id": "FRT00005C5E_07_IF166L_TRR3",
                "source_url": "https://crism.jhuapl.edu/",
                "limitations": "Atmospheric CO2 absorption bands; column striping.",
                "uncertainty_handling": "Delineates science targets (carbonates and clays) for excursion objectives."
            },
            {
                "id": "m2020-perseverance-traverse",
                "title": "Mars 2020 Perseverance Rover Traversed Path & Waypoints",
                "instrument": "Perseverance Rover Navcam / Hazcam / PIXL / SHERLOC",
                "mission": "NASA Mars 2020 Mission (NASA/JPL)",
                "spatial_resolution": "Ground Truth (< 0.01 m)",
                "coverage": "Jezero Floor to Delta Front & Margin Carbonates",
                "crs": "IAU_2015:49900",
                "pds_product_id": "M2020_TRAVERSE_SOL_0001_1000",
                "source_url": "https://mars.nasa.gov/mars2020/",
                "limitations": "Ground track limited to traversed path; does not cover unvisited northern fan.",
                "uncertainty_handling": "Verified ground-truth base camp and sample depots."
            }
        ]
    }).to_string();

    let state = Arc::new(AppState {
        grid,
        features_geojson: features_str,
        provenance_json,
    });

    let app = Router::new()
        .route("/api/mars/grid-summary", get(get_grid_summary))
        .route("/api/mars/features", get(get_features))
        .route("/api/mars/provenance", get(get_provenance))
        .route("/api/mars/route", post(post_route))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], 8081));
    println!("[INFO] 🛰️ MARS PATHFINDER microservice listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.expect("Failed to bind to 127.0.0.1:8081");
    axum::serve(listener, app).await.unwrap();
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_grid() -> DtmGrid {
        let rows: usize = 40;
        let cols: usize = 40;
        let min_lat: f64 = 18.41;
        let max_lat: f64 = 18.49;
        let min_lon: f64 = 77.40;
        let max_lon: f64 = 77.50;

        let mut elevations = vec![-2560.0f32; rows * cols];
        let mut hazard_mask = vec![0.0f32; rows * cols];
        let uncertainty_mask = vec![0.0f32; rows * cols];

        // Create an obstacle ridge in the middle
        for r in 15..25 {
            for c in 15..25 {
                elevations[r * cols + c] = -2450.0; // 110m high steep scarp
            }
        }

        // Add a hazard spot
        hazard_mask[10 * cols + 10] = 1.0;

        let d_phi = (max_lat - min_lat).to_radians() / (rows - 1) as f64;
        let d_lambda = (max_lon - min_lon).to_radians() / (cols - 1) as f64;
        let mid_phi = ((min_lat + max_lat) / 2.0).to_radians();

        let cell_size_y = MARS_EQUATORIAL_RADIUS_M * d_phi;
        let cell_size_x = MARS_EQUATORIAL_RADIUS_M * mid_phi.cos() * d_lambda;

        let mut grid = DtmGrid {
            rows,
            cols,
            min_lat,
            max_lat,
            min_lon,
            max_lon,
            cell_size_x_m: cell_size_x,
            cell_size_y_m: cell_size_y,
            min_elevation_m: -2560.0,
            max_elevation_m: -2450.0,
            elevations,
            slopes: Vec::new(),
            hazard_mask,
            uncertainty_mask,
        };
        grid.compute_horn_slopes();
        grid
    }

    #[test]
    fn test_mars_scale_factors() {
        let lat1 = 18.4447;
        let lon1 = 77.4508;
        let lat2 = 18.4457;

        let d_mars = calc_3d_dist(lat1, lon1, 0.0, lat2, lon1, 0.0);

        let earth_radius = 6378137.0;
        let d_earth = (lat2 - lat1).to_radians() * earth_radius;

        let scale_ratio = d_earth / d_mars;
        assert!((scale_ratio - 1.878026).abs() < 1e-3, "Scale ratio must reflect Mars radius");
    }

    #[test]
    fn test_astar_matches_dijkstra_optimality() {
        let grid = create_test_grid();
        let start_idx = grid.index(5, 5);
        let goal_idx = grid.index(35, 35);

        let req = RouteRequest {
            start: [18.42, 77.41],
            goal: [18.48, 77.49],
            max_slope_deg: 25.0,
            w_slope: 3.5,
            w_hazard: 6.0,
            w_uncertainty: 4.0,
            walk_speed_kmh: 2.4,
            o2_rate_lpm: 1.1,
            battery_wh_per_hr: 130.0,
        };

        let res_astar = run_search(&grid, start_idx, goal_idx, &req, true);
        let res_dijkstra = run_search(&grid, start_idx, goal_idx, &req, false);

        assert!(res_astar.reachable, "A* must find a path");
        assert!(res_dijkstra.reachable, "Dijkstra must find a path");

        assert!(
            (res_astar.model_cost - res_dijkstra.model_cost).abs() < 1e-4,
            "A* cost ({}) must match Dijkstra cost ({}) within float epsilon",
            res_astar.model_cost,
            res_dijkstra.model_cost
        );

        assert!(
            res_astar.nodes_explored <= res_dijkstra.nodes_explored,
            "A* explored ({}) must be <= Dijkstra explored ({})",
            res_astar.nodes_explored,
            res_dijkstra.nodes_explored
        );
    }

    #[test]
    fn test_hard_slope_exclusion() {
        let grid = create_test_grid();

        let req = RouteRequest {
            start: [18.42, 77.41],
            goal: [18.48, 77.49],
            max_slope_deg: 1.0, // unrealistically low, blocks everything with slope
            w_slope: 1.0,
            w_hazard: 1.0,
            w_uncertainty: 1.0,
            walk_speed_kmh: 2.4,
            o2_rate_lpm: 1.1,
            battery_wh_per_hr: 130.0,
        };

        let start_idx = grid.index(5, 5);
        let goal_idx = grid.index(20, 20); // inside the high plateau

        let res = run_search(&grid, start_idx, goal_idx, &req, true);
        assert!(!res.reachable, "Path should be blocked by strict 1.0 deg slope cutoff");
    }

    #[test]
    fn test_nodata_and_hazard_exclusion() {
        let grid = create_test_grid();
        let hazard_idx = grid.index(10, 10);
        assert_eq!(grid.hazard_mask[hazard_idx], 1.0);

        let req = RouteRequest {
            start: [18.42, 77.41],
            goal: [18.48, 77.49],
            max_slope_deg: 30.0,
            w_slope: 1.0,
            w_hazard: 6.0,
            w_uncertainty: 1.0,
            walk_speed_kmh: 2.4,
            o2_rate_lpm: 1.1,
            battery_wh_per_hr: 130.0,
        };

        let start_idx = grid.index(9, 10);
        let goal_idx = grid.index(11, 10);

        let res = run_search(&grid, start_idx, goal_idx, &req, true);
        assert!(res.reachable);
        assert!(!res.path_indices.contains(&hazard_idx), "Path must not step on hazard cell");
    }
}
