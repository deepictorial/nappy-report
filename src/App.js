import './App.css';
import Badge from 'react-bootstrap/Badge';
import Card from 'react-bootstrap/Card';
import 'bootstrap/dist/css/bootstrap.min.css';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Jumbotron from 'react-bootstrap/Jumbotron';
import Container from 'react-bootstrap/Container';
import ListGroup from 'react-bootstrap/ListGroup';
import Table from 'react-bootstrap/Table';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import axios from 'axios';
import { PureComponent } from 'react';

class App extends PureComponent {

  constructor(props) {
    super(props);
    this.state = {bins: [], allEvents: [], recentEvents: [], periodicStats: []};
  }

  getData() {
    let params = new URLSearchParams(window.location.search);
    let buttonId = params.get('button');
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const url = "https://nappy.rura.link/diaper-record?button="+buttonId+"&timezone="+timezone;
    axios.get(url)
    .then(response => {
      // handle success
      this.setState({
        bins: response.data.pails,
        allEvents: response.data.events,
        recentEvents: response.data.recent_events,
        periodicStats: response.data.periodic_stats
      });
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    })
    .then(function () {
      // always executed
    });
  }

  calculateCountdown(lastDiaper) {
    let now = Math.round(Date.now() / 1000);
    let diff = (now - lastDiaper);
    // clear countdown when date is reached
    if (diff <= 0) return false;

    const timeLeft = {
      years: 0,
      days: 0,
      hours: 0,
      min: 0,
      sec: 0,
      millisec: 0,
    };

    if (diff >= (365.25 * 86400)) { // 365.25 * 24 * 60 * 60
       timeLeft.years = Math.floor(diff / (365.25 * 86400));
       diff -= timeLeft.years * 365.25 * 86400;
     }
    if (diff >= 86400) { // 24 * 60 * 60
       timeLeft.days = Math.floor(diff / 86400);
       diff -= timeLeft.days * 86400;
     }
    if (diff >= 3600) { // 60 * 60
       timeLeft.hours = Math.floor(diff / 3600);
       diff -= timeLeft.hours * 3600;
    }
    if (diff >= 60) {
       timeLeft.min = Math.floor(diff / 60);
       diff -= timeLeft.min * 60;
    }
    timeLeft.sec = diff;
    return timeLeft;

  }

  componentDidMount() {
    this.getData();
  }
  
  render() {    
    let lastDiaper, poopTotal, peeTotal, timeSince;

    function getLastDiaper(array) {
      for (let i=0; i < array.length; i++){
        if(array[i].event != 'reset') {
          lastDiaper = array[i].timestamp;
          break;
        }
      }
    }

    function getTodayEvent(stat) {
      if(stat.window === '24h') {
        poopTotal = stat.poop_totals;
        peeTotal = stat.pee_totals;
        return true;
      }
      return false;
    }

    this.state.periodicStats.filter(getTodayEvent);
    getLastDiaper(this.state.recentEvents);
    timeSince = this.calculateCountdown(lastDiaper);

    return (
      <div className="App">
        <div className="App-body">
          <Tabs defaultActiveKey="Diary" id="noanim-tab">
            <Tab eventKey="Diary" title="Diary">
                <div>
                  <FullCalendar
                    plugins={[ dayGridPlugin, timeGridPlugin, listPlugin  ]}
                    initialView="timeGridDay"
                    aspectRatio=".5"
                    headerToolbar={{
                        left: 'title',
                        center: 'prev,listWeek,timeGridDay,timeGridWeek,next',
                        right: ''
                      }}
                    events={this.state.allEvents}
                  />
                </div>
            </Tab>
            <Tab eventKey="Bulletin" title="Bulletin">
              <Jumbotron fluid>
                <Container>
                  <h5>
                    Time since baby was last changed:
                  </h5>
                  <h2>{timeSince.hours}hrs {timeSince.min}mins {timeSince.sec}s</h2>
                </Container>
              </Jumbotron>
                <Card className="activity-card">
                  <Card.Header as="h1">Activity Today</Card.Header>
                      <Card.Title><h3>Baby poops: <Badge variant="warning">{poopTotal}</Badge></h3></Card.Title>
                      <Card.Title><h3>Baby pees: <Badge variant="info">{peeTotal}</Badge></h3></Card.Title>
                  </Card>
              <Card className="activity-list">
                <Card.Header as="h1">Last 5 events</Card.Header>
                <ListGroup variant="flush">
                  {
                    this.state.recentEvents.map((event) => (
                      <ListGroup.Item><h5>{event.event_name} @ {event.timestamp_in_timezone}</h5></ListGroup.Item>
                    ))
                  }
                </ListGroup>
              </Card>
            </Tab>
            <Tab eventKey="NappyStats" title="Nappy Stats">
              <Table striped bordered hover variant="light">
                <thead>
                  <tr>
                    <th className="table-header">#</th>
                    <th className="table-header">Poops</th>
                    <th className="table-header">Pees</th>
                    <th className="table-header">Nappies</th>
                    <th className="table-header">Average</th>
                  </tr>
                </thead>
                <tbody>
                  { 
                    this.state.periodicStats.map((stat) => (
                      <tr>
                        <td className="table-header"><h4>{stat.window}</h4></td>
                        <td><h2>{stat.poop_totals}</h2></td>
                        <td><h2>{stat.pee_totals}</h2></td>
                        <td><h2>{stat.total}</h2></td>
                        <td><h3>{stat.avg_per_day}</h3></td>
                      </tr>
                  ))}
                </tbody>
              </Table>
            </Tab>
            <Tab eventKey="Bins" title="Bins" >
              {
                this.state.bins.map((bin) => (
                <Card className="bin-card"> 
                <Card.Header className="bin-card-header">{bin.name}</Card.Header>
                <Card.Body className="bin-card-body">
                  <ProgressBar striped variant="danger" now={bin.percent} />
                  <Card.Title className="bin-card-title">{bin.percent}% full<br/><h4>{bin.dirty} of {bin.capacity} nappies</h4></Card.Title>
                </Card.Body>
                <Badge variant="dark">Last emptied at: {bin.last_event.date}</Badge>
              </Card>
              ))}
            </Tab>
          </Tabs>  
        </div>
      </div>
    );
  }
  
}

export default App;
