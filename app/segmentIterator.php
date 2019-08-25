<?php
namespace bpp;

class SegmentIterator implements \Iterator
{
    private $_array = array();
    private $direction = 1;
    private $position = 0;

    public function __construct($array, $direction)
    {
        $this->_array = $array;
        $this->direction = $direction;
        if ($direction > 0) {
            $this->position = 0;
        } else {
            $this->position = count($array) - 1;
        }
    }

    public function current()
    {
        return $this->_array[$this->position];
    }

    public function key()
    {
        return $this->position;
    }

    public function next()
    {
        $this->position += $this->direction;
    }

    public function nextSegment()
    {
        return $this->_array[$this->position + $this->direction];
    }

    public function segmentLength()
    {
        if ($this->direction > 0) {
            return $this->nextSegment()->dist - $this->current()->dist;
        } else {
            return $this->current()->dist - $this->nextSegment()->dist;
        }
    }

    public function elevationChange()
    {
        return $this->nextSegment()->ele - $this->current()->ele;
    }

    public function rewind()
    {
        if ($this->direction > 0) {
            $this->position = 0;
        } else {
            $this->position = count($this->_array) - 1;
        }
    }

    public function valid()
    {
        return isset($this->_array[$this->position]);
    }

    public function nextValid()
    {
        return isset($this->_array[$this->position + $this->direction]);
    }
}
