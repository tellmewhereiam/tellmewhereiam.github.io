$(document).ready(() => {
    $.getJSON('https://rymultiservicios.com/api/provincias').done((data) => {
        let options = [
            '<option value="" disabled selected>Selecciona una provincia</option>',
        ]
        data.map(({ id, nombre }) => {
            options.push(`<option value=${id}>${nombre}</option>`)
        })
        $('#provincia-select').append(options).select2({
            theme: 'bootstrap',
            allowClear: true,
            language: 'es',
            placeholder: 'Selecciona una provincia',
        })
    })

    getLocation()

    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition)
        } else {
            alert('Geolocation is not supported by this browser.')
        }
    }

    function showPosition(position) {
        console.log(
            'Latitud: ' +
                position.coords.latitude +
                ', Longitude: ' +
                position.coords.longitude
        )
    }
})

$(() => {
    $('#provincia-select').on('select2:select', (e) => {
        const idProvincia = e.params.data.id

        const settings = {
            url: 'https://rymultiservicios.com/api/search/municipio',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({
                idProvincia: parseInt(idProvincia),
            }),
        }

        $.ajax(settings).done((data) => {
            let options = [
                '<option value="" disabled selected>Selecciona un municipio</option>',
            ]
            data.map(({ id, nombre }) => {
                options.push(`<option value=${id}>${nombre}</option>`)
            })
            $('#municipio-select')
                .removeAttr('disabled')
                .append(options)
                .select2({
                    theme: 'bootstrap',
                    allowClear: true,
                    language: 'es',
                    placeholder: 'Seleccione un municipio',
                })
        })
    })
})
