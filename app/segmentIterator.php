<?php
namespace bpp;

class SegmentIterator implements \Iterator
{
    private $route;
    private $routeIndex = 0;
    private $trailIndex = 0;

    public function __construct($route)
    {
        $this->route = $route;
        $this->routeIndex = 0;
        $this->trailIndex = -1;
    }

    public function current()
    {
        if ($this->trailIndex != -1)
        {
            if (isset ($this->route[$this->routeIndex]->trail))
            {
                return $this->route[$this->routeIndex]->trail[$this->trailIndex];
            }
        }

        return $this->route[$this->routeIndex];
    }

    public function key()
    {
        return $this->routeIndex . ':' . $this->trailIndex;
    }

    public function next()
    {
        if (isset ($this->route[$this->routeIndex]->trail))
        {
            if ($this->trailIndex >= count($this->route[$this->routeIndex]->trail) - 1)
            {
                $this->routeIndex++;
                $this->trailIndex = -1;
            }
            else
            {
                $this->trailIndex++;
            }
        }
        else
        {
            $this->routeIndex++;
            $this->trailIndex = -1;
        }
    }

    public function rewind()
    {
        $this->routeIndex = 0;
        $this->trailIndex = -1;
    }

    public function valid()
    {
        if ($this->trailIndex != -1)
        {
            if (isset ($this->route[$this->routeIndex]))
            {
                if (isset($this->route[$this->routeIndex]->trail))
                {
                    return isset($this->route[$this->routeIndex]->trail[$this->trailIndex]);
                }

                return true;
            }

            return false;
        }

        return isset ($this->route[$this->routeIndex]);
    }
}
