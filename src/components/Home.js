import React, {Component} from "react";
import PropTypes from "prop-types";
import classNames from 'classnames';

import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import CircularProgress from '@material-ui/core/CircularProgress';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import TextField from '@material-ui/core/TextField';
import Collapse from '@material-ui/core/Collapse';
import {saveAs} from 'file-saver';
import xmlJS from 'xml-js';

import {withStyles} from "@material-ui/core/styles";

const URL_REGEX = new RegExp(/(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi);

const styles = theme => ({
  homeRoot: {
  },
  homeRootFull: {
    top: 0,
    [theme.breakpoints.up("sm")]: {
      top: 0,
    },
  },
  greetings: {
    padding: "8px",
    margin: "8px",
    height: "calc(100% - 32px)",
  },

  wrapper: {
    position: "absolute",
    left: 0,
    bottom: 0,
    right: 0,
    top: 0,
    zIndex: 100,

    padding: "15px",
    textAlign: "left",
  },

  buttons: {
    marginLeft: 10,
  },

  imageToLabel: {
    height: "100%",
    width: "auto",
    maxWidth: "100%",
  },

  imageButtonsFlex: {
    display: "flex",
    justifyContent: "space-between",
    position: "absolute",
    left: 10,
    bottom: 10,
    right: 10,
    top: 10,
  },

  imageFlex: {
    maxWidth: "60%",
  },

  imagePreviews: {
    listStyleType: "none",
  },

  imagePreviewsListElem: {
    maxWidth: "100%",
    display: "flex",
  },

  imagePreviewsImg: {
    maxWidth: "30%",
    margin: "10px",
  },

  imageLoader: {
    margin: "10px",
  },

  hidden: {
    display: "none",
  },

});




class Home extends Component {

  state = {
    tcxFile: null,
    courseName: null,
    isCourseNameEditable: false,
    tcxData: null,
  }

  onFileChange = e => {
    const files = Array.from(e.target.files);
    this.setState({tcxFile: files[0]});
    this.parseTCX(files[0]);
  }

  onCourseNameChange = e => {
    this.setState({courseName: e.target.value});
  }


  parseTCX = (TCXFile) => {

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target.result;
      const jsonStr = xmlJS.xml2json(fileContent, {compact: true, instructionHasAttributes: true});
      const data = JSON.parse(jsonStr);
      this.setState({tcxData: data});
      const courseName = this.getCourseName(data);
      this.setState({courseName: courseName, isCourseNameEditable: true});
    };
    reader.readAsText(TCXFile);
  }

  getCourseName = (tcxData) => {
    return tcxData.TrainingCenterDatabase.Folders.Courses.CourseFolder.CourseNameRef.Id._text;
  }

  setCourseName = (tcxData, courseName) => {
    tcxData.TrainingCenterDatabase.Folders.Courses.CourseFolder.CourseNameRef.Id._text = courseName;
    tcxData.TrainingCenterDatabase.Courses.Course.Name._text = courseName;
  }

  addNotes = (coursePoints) => {
    let point;
    for (const index in coursePoints) {
      point = coursePoints[index];
      point.Notes = point.Name;
    }
  }

  getDistance(trackPoint, coursePoint) {
    const trackPointX = trackPoint.Position.LatitudeDegrees._text;
    const trackPointY = trackPoint.Position.LongitudeDegrees._text;
    const coursePointX = coursePoint.Position.LatitudeDegrees._text;
    const coursePointY = coursePoint.Position.LongitudeDegrees._text;
    if (trackPointX == coursePointX && trackPointY == coursePointY) {
      return 0;
    }
    return Math.sqrt(
        Math.pow(parseFloat(coursePointX) - parseFloat(trackPointX), 2) +
        Math.pow(parseFloat(coursePointY) - parseFloat(trackPointY), 2)
      )
  }

  copyCoordinates = (sourcePoint, targetPoint) => {
    sourcePoint.Position.LatitudeDegrees = targetPoint.Position.LatitudeDegrees;
    sourcePoint.Position.LongitudeDegrees = targetPoint.Position.LongitudeDegrees;
  }

  setClosestCoordinatesForCoursePoints = (coursePoints, trackPoints) => {
    // https://stackoverflow.com/a/56306192/821594
    let coursePoint;
    let closestTrackPoint;
    for (const index in coursePoints) {
      coursePoint = coursePoints[index];
      closestTrackPoint = trackPoints.reduce((a, b) => this.getDistance(a, coursePoint) < this.getDistance(b, coursePoint) ? a : b);
      this.copyCoordinates(closestTrackPoint, coursePoint)
    }
  }

  getCoordinates = (point) => {
    const lat = point.Position.LatitudeDegrees._text;
    const lon = point.Position.LongitudeDegrees._text;
    return [lat, lon];
  }

  sortCoursePoints = (coursePoints, trackPoints) => {
    let trackPointsDistanceMap = {};
    let trackPoint, distance;
    for (const index in trackPoints) {
      trackPoint = trackPoints[index];
      distance = trackPoint.DistanceMeters._text;
      trackPointsDistanceMap[this.getCoordinates(trackPoint)] = parseFloat(distance);
    }
    let sortFunc = (pointA, pointB) => {
      const coordA = this.getCoordinates(pointA);
      const coordB = this.getCoordinates(pointB);
      const distA = trackPointsDistanceMap[coordA];
      const distB = trackPointsDistanceMap[coordB];
      console.log(`comparing ${distA} and ${distB} for pa=${coordA} and pb=${coordB}`);
      return distA > distB ? 1 : -1;
    }
    coursePoints.sort(sortFunc);
    return coursePoints;
  }

  handleAdoptTcxForWahoo = () => {
    const tcxData = structuredClone(this.state.tcxData);
    const tcxRoot = tcxData.TrainingCenterDatabase;
    const course = tcxRoot.Courses.Course;
    const trackPoints = course.Track.Trackpoint;
    const coursePoints = Symbol.iterator in Object(course.CoursePoint) ? course.CoursePoint : [course.CoursePoint];

    this.addNotes(coursePoints);
    // alltrails is already doing it, skipping
    // this.setClosestCoordinatesForCoursePoints(coursePoints, trackPoints);
    const sortedCoursePoints = this.sortCoursePoints(coursePoints, trackPoints);
    course.CoursePoint = sortedCoursePoints;

    this.setCourseName(tcxData, this.state.courseName);
    this.saveTcx(tcxData, this.getUpdatedFileName(this.state.tcxFile.name));
  }

  getUpdatedFileName = (fileName, suffix='_upd') => {
    const dotLastIndex = fileName.lastIndexOf('.');
    const name = fileName.substring(0, dotLastIndex); 
    const ext = fileName.substring(dotLastIndex + 1);
    return `${name}${suffix}.${ext}`;
  }

  saveTcx = (tcxData, fileName) => {
    const tcxAsJsonData = JSON.stringify(tcxData);
    const xmlData = xmlJS.json2xml(tcxAsJsonData, {compact: true, spaces: 2});
    const blob = new Blob([xmlData], {type: "text/plain;charset=utf-8"});
    saveAs(blob, fileName);
  }

  componentDidMount() {
  }

  render () {
    const {classes} = this.props;
    const {
      tcxFile,
      courseName,
      isCourseNameEditable,
    } = this.state;

    return (
      <div className={classes.homeRoot}>
        <Paper elevation={4} className={classes.greetings}>
          <h2>Convert TCX file for Wahoo</h2>
          <div>
            To convert GPX to TCX use <a href="https://www.alltrails.com/converter">https://www.alltrails.com/converter</a>
          </div>
          <hr />
          <div>
            <input type='file' accept='.gpx' onChange={this.onFileChange} /> 
          </div>
          <TextField
            id="route-title-input"
            label="Route Title"
            disabled={!isCourseNameEditable}
            value={courseName||''}
            onChange={this.onCourseNameChange}
          />
          <div>
            <Button
              color="primary"
              variant="contained"
              disabled={!tcxFile}
              onClick={this.handleAdoptTcxForWahoo} >
              Convert For Wahoo
            </Button>
          </div>
        </Paper>
      </div>
    );
  }
}

Home.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Home);
