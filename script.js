"use strict";

class Workout {
  _type;
  _coords;
  _distance;
  _duration;
  _description;

  _date = new Date();
  _id = Date.now(); // Usually use a library to generate the id

  constructor(coords, distance, duration, type) {
    this._type = type;
    this._coords = coords;
    this._distance = distance;
    this._duration = duration;
    this._description = `${this._type} on ${this._formatDate()}`;
  }

  _formatDate() {
    return new Intl.DateTimeFormat(navigator.language, {
      month: "long",
      day: "2-digit",
    }).format(this._date);
  }

  get type() {
    return this._type;
  }

  get description() {
    return this._description;
  }

  get coords() {
    return this._coords;
  }

  get id() {
    return this._id;
  }

  get distance() {
    return this._distance;
  }

  get duration() {
    return this._duration;
  }
}

class Running extends Workout {
  _cadence;
  _pace;

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration, "Running");
    this._cadence = cadence;
    this._pace = this._duration / this._distance;
  }

  get cadence() {
    return this._cadence;
  }

  get pace() {
    return this._pace;
  }
}

class Cycling extends Workout {
  _elevationGain;
  _speed;

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration, "Cycling");
    this._elevationGain = elevationGain;
    this._speed = this._distance / (this._duration / 60);
  }

  get elevationGain() {
    return this._elevationGain;
  }

  get speed() {
    return this._speed;
  }
}

/////////////////////////////////////////////

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class App {
  #map;
  #mapEvent;
  #workouts = [];
  #zoomLevel = 13;

  constructor() {
    // Get current user's position & render the map & add click event to the map
    this.#getPosition();

    // Load data from localStorage
    this.#loadWorkouts();

    // Submit the form
    form.addEventListener("submit", this.#newWorkout.bind(this));

    // Toggle fields in the form
    inputType.addEventListener("change", this.#toggleElevationField);

    // Move to popup
    containerWorkouts.addEventListener("click", this.#moveToPopup.bind(this));
  }

  #getPosition() {
    navigator.geolocation?.getCurrentPosition(
      this.#renderMap.bind(this),
      function () {
        alert("Could not get your position!");
      }
    );
  }

  #renderMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map("map").setView(coords, this.#zoomLevel); // Zoom level

    // Theme of the map
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on("click", this.#showForm.bind(this));

    this.#workouts.forEach(workout => {
      this.#renderMarker(workout);
    });
  }

  #showForm(e) {
    this.#mapEvent = e;

    form.classList.remove("hidden");
    inputDistance.focus();
  }

  #hideForm() {
    // Empty inputs
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        "";

    form.style.display = "none";
    form.classList.add("hidden");

    setTimeout(() => {
      form.style.display = "grid";
    }, 1);
  }

  #toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  #newWorkout(e) {
    e.preventDefault();

    const { lat, lng } = this.#mapEvent.latlng;

    // Get data
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    let workout;

    // Create Workout object (Running / Cycling)
    if (type === "running") {
      const cadence = +inputCadence.value;

      if (
        !App.validInputs(distance, duration, cadence) ||
        !App.allPositive(distance, duration, cadence)
      )
        return alert("Inputs have to be positive numbers!");

      workout = new Running([lat, lng], distance, duration, cadence);

      //
    } else if (type === "cycling") {
      const elevation = +inputElevation.value;
      if (
        !App.validInputs(distance, duration, elevation) ||
        !App.allPositive(distance, duration)
      )
        return alert("Inputs have to be positive numbers!");

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to workout array
    this.#workouts.push(workout);

    // Render workout on the map as marker and popup
    this.#renderMarker(workout);

    // Render workout on the list
    this.#renderWorkout(workout);

    // Hide the form + Clear input fields
    this.#hideForm();

    // Save all workouts to localStorage
    this.#saveWorkouts();
  }

  static validInputs(...inputs) {
    return inputs.every(input => Number.isFinite(input));
  }

  static allPositive(...inputs) {
    return inputs.every(input => input > 0);
  }

  #renderMarker(workout) {
    console.log(workout);
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type.toLowerCase()}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "Running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`
      )
      .openPopup();
  }

  #renderWorkout(workout) {
    // prettier-ignore
    let html = `
          <li class="workout workout--${workout.type.toLowerCase()}" data-id="${workout.id}">
            <h2 class="workout__title">${workout.description}</h2>

            <div class="workout__details">
              <span class="workout__icon">${workout.type === "Running" ? "🏃‍♂️" : "🚴‍♀️"}</span>
              <span class="workout__value">${workout.distance}</span>
              <span class="workout__unit">km</span>
            </div> 

            <div class="workout__details">
              <span class="workout__icon">⏱</span>
              <span class="workout__value">${workout.duration}</span>
              <span class="workout__unit">min</span>
            </div>`;

    if (workout.type === "Running") {
      html += `
            <div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${workout.pace.toFixed(1)}</span>
              <span class="workout__unit">min/km</span>
            </div>

            <div class="workout__details">
              <span class="workout__icon">🦶🏼</span>
              <span class="workout__value">${workout.cadence}</span>
              <span class="workout__unit">spm</span>
            </div>`;
    } else if (workout.type === "Cycling") {
      html += `
            <div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${workout.speed.toFixed(1)}</span>
              <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">⛰</span>
              <span class="workout__value">${workout.elevationGain}</span>
              <span class="workout__unit">m</span>
            </div>`;
    }

    containerWorkouts.insertAdjacentHTML("afterbegin", html);
  }

  #moveToPopup(e) {
    const workoutEl = e.target.closest(".workout");

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      workout => workout.id === +workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#zoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  #saveWorkouts() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  #loadWorkouts() {
    const data = JSON.parse(localStorage.getItem("workouts"));

    if (!data) return;

    const realData = data.map(workout => {
      return workout._type === "Running"
        ? new Running(
            workout._coords,
            workout._distance,
            workout._duration,
            workout._cadence
          )
        : new Cycling(
            workout._coords,
            workout._distance,
            workout._duration,
            workout._elevationGain
          );
    });

    this.#workouts = realData;

    this.#workouts.forEach(workout => {
      this.#renderWorkout(workout);
    });
  }

  reset() {
    localStorage.removeItem("workouts");
    location.reload(true);
  }
}

const app = new App();
