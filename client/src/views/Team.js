import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Row, Col, ListGroup } from 'react-bootstrap';

import NextEvent from './partials/NextMatchup';
import TeamCard from '../components/cards/TeamCard';
import BarChart from '../components/charts/BarChart';

const getFavorites = (team_id) => {
    const favorites = JSON.parse(localStorage.getItem("favorites"));
    if (favorites) {

        const isFavorite = favorites.find(favorite => favorite.id == team_id);
        if (isFavorite) {

            return isFavorite;
            
        } 
        return false
    }
}

function Team() {
    const { team_id } = useParams();

    const [team, setTeam] = useState({});
    const [nextMatchup, setNextMatchup] = useState(null);


    const [favorite, setFavorite] = useState(getFavorites(team_id));

   


    const getTeamInfo = async (team_id) => {

        const response = await fetch(`/api/cfb/team/${team_id}/information`);
        const team = await response.json();

        if (response.status !== 200) {
            throw Error(team)
        }
        let { nextEvent } = team;
        if (nextEvent) {
            setNextMatchup(nextEvent);
        }
        return team;

    }

    useEffect(() => {

        getTeamInfo(team_id)
            .then(setTeam)
    }, []);

    useEffect(() => {
        const favorites = JSON.parse(localStorage.getItem("favorites"));
        if (favorites && favorites.length>0) {
            const isFavorite = favorites.find(favorite => favorite.id == team_id);
            console.log({ isFavorite });
            if (isFavorite) {
                setFavorite(isFavorite);
            }
        }
    }, [])

    const makeFavorite = () => {

        const favorites = JSON.parse(localStorage.getItem("favorites"));
        if (favorites) {

            const isFavorite = favorites.find(favorite => favorite.id == team_id);
            if (isFavorite) {
                setFavorite(isFavorite);
                return;
            }
            favorites.push({ name: team.abbreviation, id: team.id })
            localStorage.setItem("favorites", JSON.stringify(favorites))
            setFavorite({ name: team.abbreviation, id: team.id })
        }
    }


    const createTeamSummary = function (team) {


        let { id, abbreviation, displayName, logos, nextEvent, record, standingSummary, rank } = team;

        let short_date;
        let short_name;
        if (nextEvent && nextEvent[0]) {
            short_date = nextEvent[0]?.date;
            short_name = nextEvent[0]?.name;
            if (short_date) {
                short_date = new Date(nextEvent[0].date).toLocaleDateString('en-US')
            }
        }
        return {
            id,
            abbreviation,
            title: displayName,
            logo: logos[0]?.href,
            "Next Game": `${short_name} on ${short_date}`,
            record: record.items[0],
            rank,
            standing: standingSummary
        }
    }

    const createDataSetsFromTeamRecordStats = (stats, teamInfo) => {
        const { color, alternateColor, abbreviation } = teamInfo;
        var data = stats.map((stat) => stat.value >= 5 && stat.name.toLowerCase().includes("points") && stat)
            .filter(x => x);

        const labels = data.map(({ name }) => name);

        const datasets = [{
            label: abbreviation,
            backgroundColor: "#" + color,
            borderColor: "#" + alternateColor,
            data: data.map(({ value }) => value),
        }]

        return {
            labels,
            datasets
        }
    }

    const { color, alternateColor, abbreviation, links } = team;
    const style = { color: "#" + color, backgroundColor: "#" + alternateColor };



    return (
        <Row >

            <Col xs={12} sm={12} className={"mb-2"} >
                {team && team["displayName"] && <Row>
                    <Col xs={12}>
                        <TeamCard customStyle={style} {...createTeamSummary(team)} favorite={favorite} makeFavorite={makeFavorite}>

                        </TeamCard>
                    </Col>
                    <Col xs={12}>
                        <Row>
                            <Col sm={4} className="text-center">
                                <h6>Team Links</h6>
                                <ListGroup variant="flush">
                                    {links && links.length > 0 ? links.map(link => (
                                        <ListGroup.Item><a href={link.href} target="_blank">{link.text}</a></ListGroup.Item>
                                    )) : <ListGroup.Item>No Links supplied for this team.</ListGroup.Item>}

                                </ListGroup>
                            </Col>
                            <Col sm={8}>
                                <BarChart {...createDataSetsFromTeamRecordStats(team.record.items[0].stats, { color, alternateColor, abbreviation })} />
                            </Col>
                        </Row>
                    </Col>
                </Row>}
            </Col>
            <Col xs={12} sm={12}>
                {nextMatchup && nextMatchup[0] ? <NextEvent {...nextMatchup[0]} /> : <p>This team is coming up on a bye week. Check back next week.</p>}

            </Col>
        </Row>
    );

}

export default Team;